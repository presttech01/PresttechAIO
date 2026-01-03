import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import { sql } from "drizzle-orm";

const upload = multer({ storage: multer.memoryStorage() });

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  next();
}

function requireHead(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if ((req.user as any)?.role !== "HEAD") return res.status(403).json({ message: "Acesso negado - apenas HEAD" });
  next();
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(ltda|me|epp|sa|s\/a|eireli|ss)\b/gi, "")
    .trim();
}

function checkProhibitedTerms(text: string, prohibitedTerms: string[]): string | null {
  const normalizedText = normalizeText(text);
  for (const term of prohibitedTerms) {
    if (normalizedText.includes(normalizeText(term))) {
      return term;
    }
  }
  return null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // === LEADS ===
  app.get(api.leads.list.path, requireAuth, async (req, res) => {
    const filters: { status?: string; search?: string; possibleDuplicate?: boolean } = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.possibleDuplicate !== undefined) {
      filters.possibleDuplicate = req.query.possibleDuplicate === "true";
    }
    const leads = await storage.getLeads(filters);
    res.json(leads);
  });

  app.post(api.leads.create.path, requireAuth, async (req, res) => {
    const lead = await storage.createLead(req.body);
    res.status(201).json(lead);
  });

  app.post(api.leads.import.path, upload.single('file'), requireAuth, async (req, res) => {
    const leadsData = req.body;
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    if (Array.isArray(leadsData)) {
      for (const raw of leadsData) {
        try {
          const phoneRaw = raw.phone || raw.telefone || raw.telefone_raw;
          const companyName = raw.companyName || raw.razao_social;
          
          if (!phoneRaw || !companyName) {
            errors++;
            continue;
          }

          const phoneNorm = phoneRaw.replace(/\D/g, '');
          const city = raw.city || raw.cidade;
          const state = raw.state || raw.estado;
          
          const existingDuplicates = await storage.findDuplicateCandidates(companyName, city, state);
          const isPossibleDuplicate = existingDuplicates.length > 0;
          
          await storage.createLead({
            companyName,
            phoneRaw,
            phoneNorm,
            city,
            state,
            segment: raw.segment || raw.segmento,
            cnpj: raw.cnpj,
            status: "NOVO",
            possibleDuplicate: isPossibleDuplicate
          });
          
          if (isPossibleDuplicate) duplicates++;
          imported++;
        } catch (e) {
          errors++;
        }
      }
    }

    res.json({ imported, duplicates, errors });
  });

  app.get(api.leads.next.path, requireAuth, async (req, res) => {
    const recessSetting = await storage.getSetting("MODO_RECESSO");
    const recessMode = recessSetting?.value === "true";
    const userId = (req.user as any).id;
    const lead = await storage.getNextLead([], recessMode, userId);
    res.json(lead || null);
  });

  app.get("/api/leads/duplicates", requireAuth, async (req, res) => {
    const duplicates = await storage.getPossibleDuplicates();
    res.json(duplicates);
  });

  app.post("/api/leads/:id/resolve-duplicate", requireAuth, async (req, res) => {
    const { action, mergeWithId } = req.body;
    const leadId = Number(req.params.id);
    
    if (action === "ignore") {
      const lead = await storage.updateLead(leadId, { possibleDuplicate: false });
      res.json(lead);
    } else if (action === "merge" && mergeWithId) {
      const lead = await storage.updateLead(leadId, { 
        status: "POSSIVEL_DUPLICADO", 
        duplicateOfId: mergeWithId,
        possibleDuplicate: false 
      });
      res.json(lead);
    } else {
      res.status(400).json({ message: "Ação inválida" });
    }
  });

  app.get(api.leads.get.path, requireAuth, async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.sendStatus(404);
    res.json(lead);
  });

  app.patch(api.leads.update.path, requireAuth, async (req, res) => {
    const updates = req.body;
    
    if (updates.status === "PERDIDO" && !updates.lossReason) {
      return res.status(400).json({ message: "Motivo de perda é obrigatório" });
    }
    
    const lead = await storage.updateLead(Number(req.params.id), updates);
    res.json(lead);
  });

  app.delete('/api/leads/:id', requireAuth, async (req, res) => {
    const leadId = Number(req.params.id);
    const lead = await storage.getLead(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead não encontrado" });
    }
    await storage.deleteLead(leadId);
    res.status(200).json({ message: "Lead removido com sucesso" });
  });

  // === CALLS ===
  app.post(api.calls.create.path, requireAuth, async (req, res) => {
    const prohibitedTerms = await storage.getActiveProhibitedTerms();
    if (req.body.notes) {
      const foundTerm = checkProhibitedTerms(req.body.notes, prohibitedTerms);
      if (foundTerm) {
        return res.status(400).json({ 
          message: `Atenção: termo proibido detectado "${foundTerm}". Ajuste o texto.`,
          prohibitedTerm: foundTerm
        });
      }
    }
    
    const log = await storage.createCallLog({ ...req.body, userId: (req.user as any).id });
    
    const leadUpdates: any = { lastContactAt: new Date() };
    
    const currentLead = await storage.getLead(log.leadId);
    if (currentLead) {
      leadUpdates.attempts = (currentLead.attempts || 0) + 1;
      if (!currentLead.assignedToId) {
        leadUpdates.assignedToId = (req.user as any).id;
      }
    }
    
    if (log.result === 'CONTATO_REALIZADO') leadUpdates.status = 'CONTATO_REALIZADO';
    if (log.result === 'SEM_RESPOSTA' || log.result === 'CAIXA_POSTAL' || log.result === 'NAO_E_RESPONSAVEL') {
      leadUpdates.status = 'TENTATIVA';
      
      const recessSetting = await storage.getSetting("MODO_RECESSO");
      if (recessSetting?.value === "true") {
        const returnDateSetting = await storage.getSetting("DATA_RETORNO_RECESSO");
        if (returnDateSetting?.value) {
          leadUpdates.nextFollowUpAt = new Date(returnDateSetting.value);
        }
      }
    }
    if (log.result === 'OPTOUT') leadUpdates.status = 'OPTOUT';
    if (log.result === 'NUMERO_INVALIDO') leadUpdates.status = 'NUMERO_INVALIDO';
    if (log.result === 'AGENDOU_DIAGNOSTICO') leadUpdates.status = 'DIAGNOSTICO_AGENDADO';
    
    await storage.updateLead(log.leadId, leadUpdates);
    
    res.status(201).json(log);
  });

  app.get(api.calls.list.path, requireAuth, async (req, res) => {
    const logs = await storage.getCallLogs(Number(req.params.id));
    res.json(logs);
  });

  // === DIAGNOSIS ===
  app.post(api.diagnosis.create.path, requireAuth, async (req, res) => {
    const d = req.body;
    let score = 0;
    if (d.hasSite) score += 3;
    if (d.hasGoogle) score += 3;
    if (d.hasDomain) score += 2;
    if (d.hasWhatsapp) score += 2;
    
    let pkg = "STARTER";
    if (score >= 4) pkg = "BUSINESS";
    if (score >= 8) pkg = "TECHPRO";

    const diagnosis = await storage.createDiagnosis({
      ...d,
      userId: (req.user as any).id,
      maturityScore: score,
      recommendedPackage: pkg as any,
      whatsappMessage: `Olá, analisei sua empresa e recomendo o plano ${pkg}.`
    });
    
    await storage.updateLead(d.leadId, { status: 'DIAGNOSTICO_AGENDADO' });
    
    res.status(201).json(diagnosis);
  });

  app.get(api.diagnosis.get.path, requireAuth, async (req, res) => {
    const list = await storage.getDiagnoses(Number(req.params.id));
    res.json(list);
  });

  // === DEALS ===
  app.post(api.deals.create.path, requireAuth, async (req, res) => {
    const deal = await storage.createDeal({ ...req.body, userId: (req.user as any).id });
    await storage.updateLead(deal.leadId, { status: deal.status === 'FECHADO' ? 'VENDIDO' : 'PROPOSTA_ENVIADA' });
    res.status(201).json(deal);
  });

  app.get(api.deals.list.path, requireAuth, async (req, res) => {
    const deals = await storage.getDeals();
    res.json(deals);
  });

  // GET /api/deals/with-leads - Get deals with lead info
  app.get('/api/deals/with-leads', requireAuth, async (req, res) => {
    const deals = await storage.getDealsWithLeads();
    res.json(deals);
  });

  // PATCH /api/deals/:id - Update deal status/value
  app.patch('/api/deals/:id', requireAuth, async (req, res) => {
    const dealId = Number(req.params.id);
    const { status, value, lossReason } = req.body;
    const userId = (req.user as any).id;
    
    const existingDeal = await storage.getDeal(dealId);
    if (!existingDeal) {
      return res.status(404).json({ message: "Negocio nao encontrado" });
    }
    
    if (status && status !== existingDeal.status) {
      await storage.createDealUpdate({
        dealId,
        userId,
        type: 'STATUS_CHANGE',
        oldStatus: existingDeal.status,
        newStatus: status,
        note: null
      });
      
      if (status === 'FECHADO') {
        await storage.updateLead(existingDeal.leadId, { status: 'VENDIDO' });
      } else if (status === 'PERDIDO') {
        await storage.updateLead(existingDeal.leadId, { status: 'PERDIDO', lossReason });
      }
    }
    
    const updated = await storage.updateDeal(dealId, { status, value, lossReason });
    res.json(updated);
  });

  // POST /api/deals/:id/updates - Add note/update to deal
  app.post('/api/deals/:id/updates', requireAuth, async (req, res) => {
    const dealId = Number(req.params.id);
    const { type, note } = req.body;
    const userId = (req.user as any).id;
    
    const update = await storage.createDealUpdate({
      dealId,
      userId,
      type: type || 'NOTE',
      note
    });
    res.status(201).json(update);
  });

  // GET /api/deals/:id/updates - Get deal timeline
  app.get('/api/deals/:id/updates', requireAuth, async (req, res) => {
    const updates = await storage.getDealUpdates(Number(req.params.id));
    res.json(updates);
  });

  // === HANDOFFS ===
  app.post(api.handoffs.create.path, requireAuth, async (req, res) => {
    const handoff = await storage.createHandoff({ ...req.body, userId: (req.user as any).id });
    
    await storage.createProductionTask({
      handoffId: handoff.id,
      status: handoff.materialsReceived ? "EM_PRODUCAO" : "AGUARDANDO_MATERIAIS",
      priority: "MEDIA",
      deliveryChecklist: {
        dominio: false,
        hospedagem: false,
        whatsapp: false,
        seoBasico: false,
        performance: false
      }
    });

    res.status(201).json(handoff);
  });

  // === PRODUCTION ===
  app.get(api.production.list.path, requireAuth, async (req, res) => {
    const tasks = await storage.getProductionTasks();
    res.json(tasks);
  });

  app.patch(api.production.update.path, requireAuth, async (req, res) => {
    const taskId = Number(req.params.id);
    const updates = req.body;
    
    const currentTask = await storage.getProductionTasks();
    const task = currentTask.find(t => t.id === taskId);
    
    if (task) {
      if (updates.status === "EM_PRODUCAO" && !task.handoff.materialsReceived) {
        return res.status(400).json({ 
          message: "Não é possível mover para Em Produção sem receber materiais" 
        });
      }
      
      if (updates.status === "ENTREGUE") {
        const checklist = task.deliveryChecklist || updates.deliveryChecklist;
        if (checklist) {
          const allChecked = Object.values(checklist).every(v => v === true);
          if (!allChecked) {
            return res.status(400).json({ 
              message: "Não é possível marcar como Entregue sem completar o checklist" 
            });
          }
        }
      }
    }
    
    const updated = await storage.updateProductionTask(taskId, updates);
    res.json(updated);
  });

  // === SUPPORT ===
  app.get(api.support.list.path, requireAuth, async (req, res) => {
    const tickets = await storage.getSupportTickets();
    res.json(tickets);
  });

  app.post(api.support.create.path, requireAuth, async (req, res) => {
    const ticket = await storage.createSupportTicket({ ...req.body, userId: (req.user as any).id });
    res.status(201).json(ticket);
  });

  // === DASHBOARD ===
  app.get(api.dashboard.stats.path, requireAuth, async (req, res) => {
    const stats = await storage.getStats();
    res.json({ ...stats, conversionRate: stats.leads > 0 ? (stats.sales / stats.leads) * 100 : 0 });
  });

  app.get("/api/stats/losses", requireAuth, async (req, res) => {
    const lossStats = await storage.getLossStats();
    res.json(lossStats);
  });

  app.get("/api/stats/me", requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const stats = await storage.getStatsForUser(userId);
    res.json(stats);
  });

  app.get("/api/stats/rankings", requireAuth, async (req, res) => {
    const rankings = await storage.getSDRRankings();
    res.json(rankings);
  });

  // === SETTINGS ===
  app.get("/api/settings", requireAuth, async (req, res) => {
    const allSettings = await storage.getSettings();
    res.json(allSettings);
  });

  app.get("/api/settings/:key", requireAuth, async (req, res) => {
    const setting = await storage.getSetting(req.params.key);
    res.json(setting || null);
  });

  app.put("/api/settings/:key", requireHead, async (req, res) => {
    const { value, description } = req.body;
    const setting = await storage.setSetting(
      req.params.key, 
      value, 
      description, 
      (req.user as any).id
    );
    res.json(setting);
  });

  // === MESSAGE TEMPLATES ===
  app.get("/api/message-templates", requireAuth, async (req, res) => {
    const category = req.query.category as string | undefined;
    const templates = await storage.getMessageTemplates(category);
    res.json(templates);
  });

  app.get("/api/message-templates/:id", requireAuth, async (req, res) => {
    const template = await storage.getMessageTemplate(Number(req.params.id));
    if (!template) return res.sendStatus(404);
    res.json(template);
  });

  app.post("/api/message-templates", requireHead, async (req, res) => {
    const template = await storage.createMessageTemplate(req.body);
    res.status(201).json(template);
  });

  app.put("/api/message-templates/:id", requireHead, async (req, res) => {
    const template = await storage.updateMessageTemplate(Number(req.params.id), req.body);
    res.json(template);
  });

  app.delete("/api/message-templates/:id", requireHead, async (req, res) => {
    await storage.deleteMessageTemplate(Number(req.params.id));
    res.sendStatus(204);
  });

  // === RULES ===
  app.get("/api/rules", requireAuth, async (req, res) => {
    const type = req.query.type as string | undefined;
    const allRules = await storage.getRules(type);
    res.json(allRules);
  });

  app.get("/api/rules/:id", requireAuth, async (req, res) => {
    const rule = await storage.getRule(Number(req.params.id));
    if (!rule) return res.sendStatus(404);
    res.json(rule);
  });

  app.post("/api/rules", requireHead, async (req, res) => {
    const rule = await storage.createRule(req.body);
    res.status(201).json(rule);
  });

  app.put("/api/rules/:id", requireHead, async (req, res) => {
    const rule = await storage.updateRule(Number(req.params.id), req.body);
    res.json(rule);
  });

  app.delete("/api/rules/:id", requireHead, async (req, res) => {
    await storage.deleteRule(Number(req.params.id));
    res.sendStatus(204);
  });

  // === SEGMENT PRESETS ===
  app.get("/api/segment-presets", requireAuth, async (req, res) => {
    const presets = await storage.getSegmentPresets();
    res.json(presets);
  });

  app.get("/api/segment-presets/:id", requireAuth, async (req, res) => {
    const preset = await storage.getSegmentPreset(Number(req.params.id));
    if (!preset) return res.sendStatus(404);
    res.json(preset);
  });

  app.get("/api/segment-presets/by-segment/:segment", requireAuth, async (req, res) => {
    const preset = await storage.getSegmentPresetBySegment(req.params.segment);
    res.json(preset || null);
  });

  app.post("/api/segment-presets", requireHead, async (req, res) => {
    const preset = await storage.createSegmentPreset(req.body);
    res.status(201).json(preset);
  });

  app.put("/api/segment-presets/:id", requireHead, async (req, res) => {
    const preset = await storage.updateSegmentPreset(Number(req.params.id), req.body);
    res.json(preset);
  });

  app.delete("/api/segment-presets/:id", requireHead, async (req, res) => {
    await storage.deleteSegmentPreset(Number(req.params.id));
    res.sendStatus(204);
  });

  // === CHECK TEXT FOR PROHIBITED TERMS ===
  app.post("/api/check-prohibited", requireAuth, async (req, res) => {
    const { text } = req.body;
    const prohibitedTerms = await storage.getActiveProhibitedTerms();
    const foundTerm = checkProhibitedTerms(text, prohibitedTerms);
    res.json({ hasProhibited: !!foundTerm, term: foundTerm });
  });

  // === LEAD GENERATOR ===
  app.get("/api/lead-generator/preview", requireAuth, async (req, res) => {
    const { casaDadosService } = await import("./services/casaDados");
    const { cnaes, city, state, daysBack, segment } = req.query;
    
    const filters = {
      cnaes: cnaes ? (cnaes as string).split(",") : undefined,
      city: city as string | undefined,
      state: state as string | undefined,
      daysBack: daysBack ? Number(daysBack) : undefined,
      limit: 10
    };
    
    const result = await casaDadosService.searchCompanies(filters);
    const normalized = casaDadosService.normalizeCompanies(result.data, segment as string);
    const existingLeads = await storage.getAllLeadsForDedup();
    
    const preview = normalized.map(lead => ({
      ...lead,
      isDuplicate: casaDadosService.checkDuplicate(lead, existingLeads)
    }));
    
    res.json({
      totalFound: result.count,
      preview,
      isApiConfigured: casaDadosService.isConfigured()
    });
  });

  app.post("/api/lead-generator/run", requireAuth, async (req, res) => {
    const { casaDadosService } = await import("./services/casaDados");
    const { cnaes, city, state, daysBack, segment, presetId } = req.body;
    const userId = (req.user as any).id;
    
    const filters = {
      cnaes: cnaes || undefined,
      city: city || undefined,
      state: state || undefined,
      daysBack: daysBack ? Number(daysBack) : undefined,
      limit: 100
    };
    
    const batch = await storage.createLeadBatch({
      userId,
      presetId: presetId || null,
      status: "PROCESSANDO",
      filters,
      totalFound: 0,
      totalImported: 0,
      totalDuplicates: 0,
      totalErrors: 0
    });
    
    try {
      const result = await casaDadosService.searchCompanies(filters);
      const normalized = casaDadosService.normalizeCompanies(result.data, segment);
      const existingLeads = await storage.getAllLeadsForDedup();
      
      let imported = 0;
      let duplicates = 0;
      let errors = 0;
      
      for (const lead of normalized) {
        try {
          const isDuplicate = casaDadosService.checkDuplicate(lead, existingLeads);
          
          if (isDuplicate) {
            duplicates++;
          }
          
          await storage.createLead({
            companyName: lead.companyName,
            phoneRaw: lead.phoneRaw,
            phoneNorm: lead.phoneNorm,
            cnpj: lead.cnpj,
            segment: lead.segment || null,
            city: lead.city || null,
            state: lead.state || null,
            openingDate: lead.openingDate || null,
            status: isDuplicate ? "POSSIVEL_DUPLICADO" : "NOVO",
            possibleDuplicate: isDuplicate,
            originList: `Batch #${batch.id}`
          });
          
          imported++;
          existingLeads.push({
            phoneNorm: lead.phoneNorm,
            cnpj: lead.cnpj,
            companyName: lead.companyName,
            city: lead.city || null,
            state: lead.state || null
          });
        } catch (err) {
          errors++;
        }
      }
      
      const updated = await storage.updateLeadBatch(batch.id, {
        status: "CONCLUIDO",
        totalFound: result.count,
        totalImported: imported,
        totalDuplicates: duplicates,
        totalErrors: errors,
        completedAt: new Date()
      });
      
      res.json(updated);
    } catch (err: any) {
      await storage.updateLeadBatch(batch.id, {
        status: "ERRO",
        errorMessage: err.message,
        completedAt: new Date()
      });
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/lead-batches", requireAuth, async (req, res) => {
    const user = req.user as any;
    const batches = user.role === "HEAD" 
      ? await storage.getLeadBatches() 
      : await storage.getLeadBatches(user.id);
    res.json(batches);
  });

  app.get("/api/lead-batches/:id", requireAuth, async (req, res) => {
    const batch = await storage.getLeadBatch(Number(req.params.id));
    if (!batch) return res.sendStatus(404);
    res.json(batch);
  });

  return httpServer;
}

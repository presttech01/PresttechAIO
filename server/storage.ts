import { db } from "./db";
import { 
  users, leads, callLogs, diagnosis, deals, dealUpdates, handoffs, productionTasks, supportTickets,
  settings, messageTemplates, rules, segmentPresets, leadBatches,
  proposals, prompts, promptVersions, siteTemplates,
  type User, type Lead, type CallLog, type Diagnosis, type Deal, type DealUpdate, type Handoff, type ProductionTask, type SupportTicket,
  type Settings, type MessageTemplate, type Rule, type SegmentPreset, type LeadBatch, type Proposal, type Prompt, type PromptVersion, type SiteTemplate,
  type InsertUser, type InsertLead, type InsertCallLog, type InsertDiagnosis, type InsertDeal, type InsertDealUpdate, type InsertHandoff, type InsertProductionTask, type InsertSupportTicket,
  type InsertSettings, type InsertMessageTemplate, type InsertRule, type InsertSegmentPreset, type InsertLeadBatch, type InsertProposal, type InsertPrompt, type InsertPromptVersion, type InsertSiteTemplate
} from "@shared/schema";
import { eq, desc, and, sql, notInArray, asc, lt, gte, or, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Leads
  getLeads(filters?: { status?: string, search?: string, userId?: number, possibleDuplicate?: boolean }): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead>;
  getNextLead(excludeIds: number[], recessMode?: boolean, userId?: number): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<void>;
  getPossibleDuplicates(): Promise<Lead[]>;
  findDuplicateCandidates(companyName: string, city: string | null, state: string | null): Promise<Lead[]>;

  // Call Logs
  createCallLog(log: InsertCallLog): Promise<CallLog>;
  getCallLogs(leadId: number): Promise<CallLog[]>;
  getTodayCallCountForLead(leadId: number): Promise<number>;

  // Diagnosis
  createDiagnosis(d: InsertDiagnosis): Promise<Diagnosis>;
  getDiagnoses(leadId: number): Promise<Diagnosis[]>;

  // Deals
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal>;
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  
  // Deal Updates
  createDealUpdate(update: InsertDealUpdate): Promise<DealUpdate>;
  getDealUpdates(dealId: number): Promise<DealUpdate[]>;
  getDealsWithLeads(): Promise<(Deal & { lead: Lead })[]>;

  // Handoffs
  createHandoff(h: InsertHandoff): Promise<Handoff>;
  getHandoffByDealId(dealId: number): Promise<Handoff | undefined>;

  // Production
  getProductionTasks(): Promise<(ProductionTask & { lead: Lead; handoff: Handoff })[]>;
  updateProductionTask(id: number, task: Partial<InsertProductionTask>): Promise<ProductionTask>;
  createProductionTask(task: InsertProductionTask): Promise<ProductionTask>;

  // Support
  getSupportTickets(): Promise<SupportTicket[]>;
  createSupportTicket(t: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, t: Partial<InsertSupportTicket>): Promise<SupportTicket>;

  // Stats
  getStats(): Promise<{ leads: number, calls: number, sales: number, revenue: number }>;
  getLossStats(): Promise<{ reason: string; count: number; segment: string | null }[]>;
  getStatsForUser(userId: number): Promise<{ leads: number, calls: number, sales: number, revenue: number }>;
  getSDRRankings(): Promise<Array<{ userId: number, userName: string, leads: number, calls: number, sales: number, revenue: number, conversionRate: number }>>;

  // Settings
  getSetting(key: string): Promise<Settings | undefined>;
  getSettings(): Promise<Settings[]>;
  setSetting(key: string, value: string, description?: string, updatedBy?: number): Promise<Settings>;

  // Message Templates
  getMessageTemplates(category?: string): Promise<MessageTemplate[]>;
  getMessageTemplate(id: number): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, template: Partial<InsertMessageTemplate>): Promise<MessageTemplate>;
  deleteMessageTemplate(id: number): Promise<void>;

  // Proposals
  createProposal(p: InsertProposal): Promise<Proposal>;
  getProposalByToken(token: string): Promise<Proposal | undefined>;
  updateProposal(id: number, p: Partial<InsertProposal>): Promise<Proposal>;
  getProposals(): Promise<Proposal[]>;

  // Prompts
  createPrompt(p: InsertPrompt): Promise<Prompt>;
  createPromptVersion(p: InsertPromptVersion): Promise<PromptVersion>;
  getPromptVersions(promptId: number): Promise<PromptVersion[]>;

  // Site Templates
  createSiteTemplate(t: InsertSiteTemplate): Promise<SiteTemplate>;
  getSiteTemplates(): Promise<SiteTemplate[]>;
  getSiteTemplate(id: number): Promise<SiteTemplate | undefined>;

  // SDR Dashboard
  getLeadsOfDay(userId: number): Promise<Lead[]>;
  getFollowUpsOverdue(userId: number): Promise<Lead[]>;
  getConversionForUser(userId: number): Promise<{ leads: number, sales: number, conversion: number }>;  getMessageTemplates(category?: string): Promise<MessageTemplate[]>;
  getMessageTemplate(id: number): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, template: Partial<InsertMessageTemplate>): Promise<MessageTemplate>;
  deleteMessageTemplate(id: number): Promise<void>;

  // Rules
  getRules(type?: string): Promise<Rule[]>;
  getRule(id: number): Promise<Rule | undefined>;
  createRule(rule: InsertRule): Promise<Rule>;
  updateRule(id: number, rule: Partial<InsertRule>): Promise<Rule>;
  deleteRule(id: number): Promise<void>;
  getActiveProhibitedTerms(): Promise<string[]>;

  // Segment Presets
  getSegmentPresets(): Promise<SegmentPreset[]>;
  getSegmentPreset(id: number): Promise<SegmentPreset | undefined>;
  getSegmentPresetBySegment(segment: string): Promise<SegmentPreset | undefined>;
  createSegmentPreset(preset: InsertSegmentPreset): Promise<SegmentPreset>;
  updateSegmentPreset(id: number, preset: Partial<InsertSegmentPreset>): Promise<SegmentPreset>;
  deleteSegmentPreset(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Leads
  async getLeads(filters?: { status?: string, search?: string, userId?: number, possibleDuplicate?: boolean }): Promise<Lead[]> {
    let conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    if (filters?.possibleDuplicate !== undefined) {
      conditions.push(eq(leads.possibleDuplicate, filters.possibleDuplicate));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(leads.companyName, `%${filters.search}%`),
          ilike(leads.phoneRaw, `%${filters.search}%`),
          ilike(leads.city, `%${filters.search}%`)
        )
      );
    }
    
    const query = conditions.length > 0 
      ? db.select().from(leads).where(and(...conditions))
      : db.select().from(leads);
    
    return await query.orderBy(desc(leads.priorityScore));
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, updates: Partial<InsertLead>): Promise<Lead> {
    const [updated] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return updated;
  }

  async deleteLead(id: number): Promise<void> {
    await db.delete(callLogs).where(eq(callLogs.leadId, id));
    await db.delete(diagnosis).where(eq(diagnosis.leadId, id));
    await db.delete(deals).where(eq(deals.leadId, id));
    await db.delete(leads).where(eq(leads.id, id));
  }

  async getNextLead(excludeIds: number[], recessMode: boolean = false, userId?: number): Promise<Lead | undefined> {
    const excludedStatuses = ["VENDIDO", "PERDIDO", "OPTOUT", "NUMERO_INVALIDO", "POSSIVEL_DUPLICADO"];
    
    let conditions = [
      notInArray(leads.status, excludedStatuses),
      lt(leads.attempts, 3),
      eq(leads.possibleDuplicate, false),
      or(
        sql`${leads.assignedToId} IS NULL`,
        userId ? eq(leads.assignedToId, userId) : sql`1=1`
      )
    ];

    const result = await db.select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(asc(leads.attempts), desc(leads.priorityScore), asc(leads.lastContactAt))
      .limit(1);
    
    const lead = result[0];
    
    if (lead && recessMode) {
      const todayCalls = await this.getTodayCallCountForLead(lead.id);
      if (todayCalls >= 1) {
        const nextResult = await db.select()
          .from(leads)
          .where(and(
            ...conditions,
            sql`${leads.id} != ${lead.id}`
          ))
          .orderBy(asc(leads.attempts), desc(leads.priorityScore), asc(leads.lastContactAt))
          .limit(10);
        
        for (const nextLead of nextResult) {
          const nextCalls = await this.getTodayCallCountForLead(nextLead.id);
          if (nextCalls < 1) {
            return nextLead;
          }
        }
        return undefined;
      }
    }
    
    return lead;
  }

  async getPossibleDuplicates(): Promise<Lead[]> {
    return await db.select()
      .from(leads)
      .where(eq(leads.possibleDuplicate, true))
      .orderBy(desc(leads.createdAt));
  }

  async findDuplicateCandidates(companyName: string, city: string | null, state: string | null): Promise<Lead[]> {
    let conditions = [ilike(leads.companyName, `%${companyName}%`)];
    if (city) conditions.push(ilike(leads.city, city));
    if (state) conditions.push(eq(leads.state, state));
    
    return await db.select()
      .from(leads)
      .where(and(...conditions))
      .limit(10);
  }

  // Calls
  async createCallLog(log: InsertCallLog): Promise<CallLog> {
    const [newLog] = await db.insert(callLogs).values(log).returning();
    return newLog;
  }

  async getCallLogs(leadId: number): Promise<CallLog[]> {
    return await db.select().from(callLogs).where(eq(callLogs.leadId, leadId)).orderBy(desc(callLogs.createdAt));
  }

  async getTodayCallCountForLead(leadId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(callLogs)
      .where(and(
        eq(callLogs.leadId, leadId),
        gte(callLogs.createdAt, today)
      ));
    
    return Number(result?.count || 0);
  }

  // Diagnosis
  async createDiagnosis(d: InsertDiagnosis): Promise<Diagnosis> {
    const [newD] = await db.insert(diagnosis).values(d).returning();
    return newD;
  }

  async getDiagnoses(leadId: number): Promise<Diagnosis[]> {
    return await db.select().from(diagnosis).where(eq(diagnosis.leadId, leadId));
  }

  // Deals
  async createDeal(d: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(d).returning();
    return newDeal;
  }

  async updateDeal(id: number, d: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await db.update(deals).set(d).where(eq(deals.id, id)).returning();
    return updated;
  }

  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals).orderBy(desc(deals.createdAt));
  }
  
  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  // Deal Updates
  async createDealUpdate(update: InsertDealUpdate): Promise<DealUpdate> {
    const [created] = await db.insert(dealUpdates).values(update).returning();
    return created;
  }

  async getDealUpdates(dealId: number): Promise<DealUpdate[]> {
    return await db.select().from(dealUpdates).where(eq(dealUpdates.dealId, dealId)).orderBy(desc(dealUpdates.createdAt));
  }

  async getDealsWithLeads(): Promise<(Deal & { lead: Lead })[]> {
    const result = await db.select({
      deal: deals,
      lead: leads
    })
    .from(deals)
    .innerJoin(leads, eq(deals.leadId, leads.id))
    .orderBy(desc(deals.createdAt));
    
    return result.map(r => ({ ...r.deal, lead: r.lead }));
  }

  // Handoffs
  async createHandoff(h: InsertHandoff): Promise<Handoff> {
    const [newH] = await db.insert(handoffs).values(h).returning();
    return newH;
  }

  async getHandoffByDealId(dealId: number): Promise<Handoff | undefined> {
    const [h] = await db.select().from(handoffs).where(eq(handoffs.dealId, dealId));
    return h;
  }

  // Production
  async getProductionTasks(): Promise<(ProductionTask & { lead: Lead; handoff: Handoff })[]> {
    const result = await db.select({
      task: productionTasks,
      lead: leads,
      handoff: handoffs
    })
    .from(productionTasks)
    .innerJoin(handoffs, eq(productionTasks.handoffId, handoffs.id))
    .innerJoin(leads, eq(handoffs.leadId, leads.id));
    
    return result.map(r => ({ ...r.task, lead: r.lead, handoff: r.handoff }));
  }

  async updateProductionTask(id: number, task: Partial<InsertProductionTask>): Promise<ProductionTask> {
    const [updated] = await db.update(productionTasks).set(task).where(eq(productionTasks.id, id)).returning();
    return updated;
  }

  async createProductionTask(task: InsertProductionTask): Promise<ProductionTask> {
    const [newTask] = await db.insert(productionTasks).values(task).returning();
    return newTask;
  }

  // Support
  async getSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(t: InsertSupportTicket): Promise<SupportTicket> {
    const [newT] = await db.insert(supportTickets).values(t).returning();
    return newT;
  }

  async updateSupportTicket(id: number, t: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    const [updated] = await db.update(supportTickets).set(t).where(eq(supportTickets.id, id)).returning();
    return updated;
  }

  // Stats
  async getStats(): Promise<{ leads: number, calls: number, sales: number, revenue: number }> {
    const [leadsCount] = await db.select({ count: sql<number>`count(*)` }).from(leads);
    const [callsCount] = await db.select({ count: sql<number>`count(*)` }).from(callLogs);
    const [salesCount] = await db.select({ count: sql<number>`count(*)` }).from(deals).where(eq(deals.status, "FECHADO"));
    const [revenue] = await db.select({ sum: sql<number>`coalesce(sum(${deals.value}), 0)` }).from(deals).where(eq(deals.status, "FECHADO"));

    return {
      leads: Number(leadsCount?.count || 0),
      calls: Number(callsCount?.count || 0),
      sales: Number(salesCount?.count || 0),
      revenue: Number(revenue?.sum || 0),
    };
  }

  async getLossStats(): Promise<{ reason: string; count: number; segment: string | null }[]> {
    const result = await db.select({
      reason: leads.lossReason,
      segment: leads.segment,
      count: sql<number>`count(*)`
    })
    .from(leads)
    .where(eq(leads.status, "PERDIDO"))
    .groupBy(leads.lossReason, leads.segment);
    
    return result.map(r => ({
      reason: r.reason || "NAO_INFORMADO",
      count: Number(r.count),
      segment: r.segment
    }));
  }

  async getStatsForUser(userId: number): Promise<{ leads: number, calls: number, sales: number, revenue: number }> {
    const [leadsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(leads).where(eq(leads.assignedToId, userId));
    const [callsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(callLogs).where(eq(callLogs.userId, userId));
    const [salesCount] = await db.select({ count: sql<number>`count(*)` })
      .from(deals).where(and(eq(deals.userId, userId), eq(deals.status, "FECHADO")));
    const [revenue] = await db.select({ sum: sql<number>`coalesce(sum(${deals.value}), 0)` })
      .from(deals).where(and(eq(deals.userId, userId), eq(deals.status, "FECHADO")));

    return {
      leads: Number(leadsCount?.count || 0),
      calls: Number(callsCount?.count || 0),
      sales: Number(salesCount?.count || 0),
      revenue: Number(revenue?.sum || 0),
    };
  }

  async getSDRRankings(): Promise<Array<{ userId: number, userName: string, leads: number, calls: number, sales: number, revenue: number, conversionRate: number }>> {
    const sdrs = await db.select().from(users).where(eq(users.role, 'SDR'));
    
    const rankings = await Promise.all(sdrs.map(async (sdr) => {
      const stats = await this.getStatsForUser(sdr.id);
      return {
        userId: sdr.id,
        userName: sdr.name,
        ...stats,
        conversionRate: stats.calls > 0 ? Math.round((stats.sales / stats.calls) * 100) : 0
      };
    }));
    
    return rankings.sort((a, b) => b.sales - a.sales || b.revenue - a.revenue);
  }

  // Settings
  async getSetting(key: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async getSettings(): Promise<Settings[]> {
    return await db.select().from(settings);
  }

  async setSetting(key: string, value: string, description?: string, updatedBy?: number): Promise<Settings> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(settings)
        .set({ value, description, updatedBy, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings)
        .values({ key, value, description, updatedBy })
        .returning();
      return created;
    }
  }

  // Message Templates
  async getMessageTemplates(category?: string): Promise<MessageTemplate[]> {
    if (category) {
      return await db.select().from(messageTemplates).where(eq(messageTemplates.category, category));
    }
    return await db.select().from(messageTemplates).orderBy(messageTemplates.category, messageTemplates.name);
  }

  async getMessageTemplate(id: number): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template;
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [created] = await db.insert(messageTemplates).values(template).returning();
    return created;
  }

  async updateMessageTemplate(id: number, template: Partial<InsertMessageTemplate>): Promise<MessageTemplate> {
    const [updated] = await db.update(messageTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(messageTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteMessageTemplate(id: number): Promise<void> {
    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
  }

  // Rules
  async getRules(type?: string): Promise<Rule[]> {
    if (type) {
      return await db.select().from(rules).where(eq(rules.type, type));
    }
    return await db.select().from(rules).orderBy(rules.type, rules.term);
  }

  async getRule(id: number): Promise<Rule | undefined> {
    const [rule] = await db.select().from(rules).where(eq(rules.id, id));
    return rule;
  }

  async createRule(rule: InsertRule): Promise<Rule> {
    const [created] = await db.insert(rules).values(rule).returning();
    return created;
  }

  async updateRule(id: number, rule: Partial<InsertRule>): Promise<Rule> {
    const [updated] = await db.update(rules)
      .set({ ...rule, updatedAt: new Date() })
      .where(eq(rules.id, id))
      .returning();
    return updated;
  }

  async deleteRule(id: number): Promise<void> {
    await db.delete(rules).where(eq(rules.id, id));
  }

  async getActiveProhibitedTerms(): Promise<string[]> {
    const prohibitedRules = await db.select()
      .from(rules)
      .where(and(eq(rules.type, "PROIBIDA"), eq(rules.isActive, true)));
    return prohibitedRules.map(r => r.term.toLowerCase());
  }

  // Segment Presets
  async getSegmentPresets(): Promise<SegmentPreset[]> {
    return await db.select().from(segmentPresets).orderBy(segmentPresets.name);
  }

  // Proposals
  async createProposal(p: InsertProposal): Promise<Proposal> {
    const token = p.publicToken || cryptoRandomToken();
    const [created] = await db.insert(proposals).values({ ...p, publicToken: token }).returning();
    return created;
  }

  async getProposalByToken(token: string): Promise<Proposal | undefined> {
    const [p] = await db.select().from(proposals).where(eq(proposals.publicToken, token));
    return p;
  }

  async updateProposal(id: number, p: Partial<InsertProposal>): Promise<Proposal> {
    const [updated] = await db.update(proposals).set(p).where(eq(proposals.id, id)).returning();
    return updated;
  }

  async getProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  // Prompts
  async createPrompt(p: InsertPrompt): Promise<Prompt> {
    const [created] = await db.insert(prompts).values(p).returning();
    return created;
  }

  async createPromptVersion(p: InsertPromptVersion): Promise<PromptVersion> {
    const [created] = await db.insert(promptVersions).values(p).returning();
    return created;
  }

  async getPromptVersions(promptId: number): Promise<PromptVersion[]> {
    return await db.select().from(promptVersions).where(eq(promptVersions.promptId, promptId)).orderBy(desc(promptVersions.version));
  }

  // Site Templates
  async createSiteTemplate(t: InsertSiteTemplate): Promise<SiteTemplate> {
    const [created] = await db.insert(siteTemplates).values(t).returning();
    return created;
  }

  async getSiteTemplates(): Promise<SiteTemplate[]> {
    return await db.select().from(siteTemplates).orderBy(desc(siteTemplates.createdAt));
  }

  async getSiteTemplate(id: number): Promise<SiteTemplate | undefined> {
    const [t] = await db.select().from(siteTemplates).where(eq(siteTemplates.id, id));
    return t;
  }

  // SDR Dashboard
  async getLeadsOfDay(userId: number): Promise<Lead[]> {
    const start = new Date();
    start.setHours(0,0,0,0);
    return await db.select().from(leads).where(and(eq(leads.assignedToId, userId), gte(leads.createdAt, start))).orderBy(desc(leads.createdAt));
  }

  // Automations
  async autoAcceptOldProposals(days: number = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const oldProposals = await db.select().from(proposals).where(and(eq(proposals.status, 'SENT'), lt(proposals.createdAt, cutoff)));
    for (const p of oldProposals) {
      await db.update(proposals).set({ status: 'ACCEPTED' }).where(eq(proposals.id, p.id));
      await db.update(leads).set({ status: 'FECHADO' }).where(eq(leads.id, p.leadId));
    }
    return oldProposals.length;
  }



  async getFollowUpsOverdue(userId: number): Promise<Lead[]> {
    const now = new Date();
    return await db.select().from(leads).where(and(eq(leads.assignedToId, userId), lt(leads.nextFollowUpAt, now))).orderBy(desc(leads.nextFollowUpAt));
  }

  async getConversionForUser(userId: number): Promise<{ leads: number, sales: number, conversion: number }> {
    const [leadsCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.assignedToId, userId));
    const [salesCount] = await db.select({ count: sql<number>`count(*)` }).from(deals).where(and(eq(deals.userId, userId), eq(deals.status, "FECHADO")));
    const leadsNum = Number(leadsCount?.count || 0);
    const salesNum = Number(salesCount?.count || 0);
    return { leads: leadsNum, sales: salesNum, conversion: leadsNum > 0 ? salesNum / leadsNum : 0 };
  }


  async getSegmentPreset(id: number): Promise<SegmentPreset | undefined> {
    const [preset] = await db.select().from(segmentPresets).where(eq(segmentPresets.id, id));
    return preset;
  }

  async getSegmentPresetBySegment(segment: string): Promise<SegmentPreset | undefined> {
    const [preset] = await db.select().from(segmentPresets).where(eq(segmentPresets.segment, segment));
    return preset;
  }

  async createSegmentPreset(preset: InsertSegmentPreset): Promise<SegmentPreset> {
    const [created] = await db.insert(segmentPresets).values(preset).returning();
    return created;
  }

  async updateSegmentPreset(id: number, preset: Partial<InsertSegmentPreset>): Promise<SegmentPreset> {
    const [updated] = await db.update(segmentPresets)
      .set({ ...preset, updatedAt: new Date() })
      .where(eq(segmentPresets.id, id))
      .returning();
    return updated;
  }

  async deleteSegmentPreset(id: number): Promise<void> {
    await db.delete(segmentPresets).where(eq(segmentPresets.id, id));
  }

  // Lead Batches
  async getLeadBatches(userId?: number): Promise<LeadBatch[]> {
    if (userId) {
      return await db.select().from(leadBatches).where(eq(leadBatches.userId, userId)).orderBy(desc(leadBatches.createdAt));
    }
    return await db.select().from(leadBatches).orderBy(desc(leadBatches.createdAt));
  }

  async getLeadBatch(id: number): Promise<LeadBatch | undefined> {
    const [batch] = await db.select().from(leadBatches).where(eq(leadBatches.id, id));
    return batch;
  }

  async createLeadBatch(batch: InsertLeadBatch): Promise<LeadBatch> {
    const [created] = await db.insert(leadBatches).values(batch).returning();
    return created;
  }

  async updateLeadBatch(id: number, batch: Partial<InsertLeadBatch & { completedAt?: Date }>): Promise<LeadBatch> {
    const [updated] = await db.update(leadBatches).set(batch).where(eq(leadBatches.id, id)).returning();
    return updated;
  }

  async getAllLeadsForDedup(): Promise<Array<{ phoneNorm: string | null; cnpj: string | null; companyName: string; city: string | null; state: string | null }>> {
    return await db.select({
      phoneNorm: leads.phoneNorm,
      cnpj: leads.cnpj,
      companyName: leads.companyName,
      city: leads.city,
      state: leads.state
    }).from(leads);
  }
}

// helper for token
function cryptoRandomToken() {
  return [...Array(40)].map(() => Math.random().toString(36)[2]).join('');
}

export const storage = new DatabaseStorage();

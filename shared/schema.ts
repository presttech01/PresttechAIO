import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === Users ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["SDR", "HEAD"] }).notNull().default("SDR"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Leads ===
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  phoneRaw: text("phone_raw").notNull(),
  phoneNorm: text("phone_norm"),
  cnpj: text("cnpj"),
  segment: text("segment"),
  city: text("city"),
  state: text("state"),
  openingDate: timestamp("opening_date"),
  status: text("status", { 
    enum: ["NOVO", "TENTATIVA", "CONTATO_REALIZADO", "DIAGNOSTICO_AGENDADO", "PROPOSTA_ENVIADA", "VENDIDO", "PERDIDO", "OPTOUT", "NUMERO_INVALIDO", "POSSIVEL_DUPLICADO"] 
  }).notNull().default("NOVO"),
  priorityScore: integer("priority_score").default(0),
  lastContactAt: timestamp("last_contact_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  nextStepAt: timestamp("next_step_at"),
  originList: text("origin_list"),
  notes: text("notes"),
  attempts: integer("attempts").default(0),
  optoutReason: text("optout_reason"),
  lossReason: text("loss_reason", { 
    enum: ["SEM_ORCAMENTO", "JA_TEM_FORNECEDOR", "SEM_INTERESSE", "NAO_E_PRIORIDADE", "CONTATO_INVALIDO", "OUTRO"] 
  }),
  possibleDuplicate: boolean("possible_duplicate").default(false),
  duplicateOfId: integer("duplicate_of_id"),
  assignedToId: integer("assigned_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  statusIdx: index("leads_status_idx").on(table.status),
  phoneNormIdx: index("leads_phone_norm_idx").on(table.phoneNorm),
  priorityScoreIdx: index("leads_priority_score_idx").on(table.priorityScore),
  segmentIdx: index("leads_segment_idx").on(table.segment),
  possibleDuplicateIdx: index("leads_possible_duplicate_idx").on(table.possibleDuplicate),
}));

// === Call Logs ===
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  userId: integer("user_id").notNull(),
  duration: integer("duration").default(0),
  result: text("result", { 
    enum: ["SEM_RESPOSTA", "CAIXA_POSTAL", "NUMERO_INVALIDO", "NAO_E_RESPONSAVEL", "CONTATO_REALIZADO", "AGENDOU_DIAGNOSTICO", "PEDIU_PROPOSTA", "OPTOUT"] 
  }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  leadIdIdx: index("call_logs_lead_id_idx").on(table.leadId),
  createdAtIdx: index("call_logs_created_at_idx").on(table.createdAt),
}));

// === Diagnosis ===
export const diagnosis = pgTable("diagnosis", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  userId: integer("user_id").notNull(),
  hasSite: boolean("has_site").default(false),
  hasGoogle: boolean("has_google").default(false),
  hasWhatsapp: boolean("has_whatsapp").default(false),
  hasDomain: boolean("has_domain").default(false),
  hasLogo: boolean("has_logo").default(false),
  objective: text("objective"),
  urgency: integer("urgency").default(1),
  notes: text("notes"),
  maturityScore: integer("maturity_score").default(0),
  recommendedPackage: text("recommended_package", { enum: ["STARTER", "BUSINESS", "TECHPRO"] }),
  whatsappMessage: text("whatsapp_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Deals ===
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  userId: integer("user_id").notNull(),
  packageSold: text("package_sold", { enum: ["STARTER", "BUSINESS", "TECHPRO"] }).notNull(),
  value: integer("value").notNull(),
  promisedDeadline: integer("promised_deadline"),
  status: text("status", { enum: ["EM_NEGOCIACAO", "PROPOSTA_ENVIADA", "FECHADO", "PERDIDO"] }).default("EM_NEGOCIACAO"),
  lossReason: text("loss_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Deal Updates (Timeline) ===
export const dealUpdates = pgTable("deal_updates", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["STATUS_CHANGE", "NOTE", "FOLLOWUP"] }).notNull(),
  oldStatus: text("old_status"),
  newStatus: text("new_status"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Handoffs ===
export const handoffs = pgTable("handoffs", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull(),
  leadId: integer("lead_id").notNull(),
  userId: integer("user_id").notNull(),
  scope: text("scope").notNull(),
  deadline: integer("deadline").notNull(),
  materialsReceived: boolean("materials_received").default(false),
  referenceLinks: text("reference_links"),
  domain: text("domain"),
  hosting: text("hosting"),
  checklist: jsonb("checklist"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Production Tasks ===
export const productionTasks = pgTable("production_tasks", {
  id: serial("id").primaryKey(),
  handoffId: integer("handoff_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  status: text("status", { enum: ["AGUARDANDO_MATERIAIS", "EM_PRODUCAO", "EM_REVISAO", "ENTREGUE", "PAUSADO"] }).default("AGUARDANDO_MATERIAIS"),
  priority: text("priority", { enum: ["BAIXA", "MEDIA", "ALTA"] }).default("MEDIA"),
  dueDate: timestamp("due_date"),
  techNotes: text("tech_notes"),
  deliveryChecklist: jsonb("delivery_checklist").$type<{
    dominio: boolean;
    hospedagem: boolean;
    whatsapp: boolean;
    seoBasico: boolean;
    performance: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === Support Tickets ===
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  userId: integer("user_id").notNull(),
  category: text("category", { enum: ["AJUSTE_TEXTO", "ACESSO", "DUPLICIDADE", "DUVIDA", "BUG", "NOVO_ESCOPO"] }).notNull(),
  status: text("status", { enum: ["ABERTO", "EM_ANDAMENTO", "RESOLVIDO"] }).default("ABERTO"),
  description: text("description").notNull(),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === NEW TABLES ===

// === Settings (Global Config) ===
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by"),
});

// === Message Templates ===
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { 
    enum: ["FOLLOWUP", "MATERIAIS", "PROPOSTA", "RECESSO", "AGENDAMENTO", "POSVENDA", "ENTREGA"] 
  }).notNull(),
  text: text("text").notNull(),
  segmentPresetId: integer("segment_preset_id"),
  variables: text("variables").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Rules (Promise Control) ===
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["PROIBIDA", "PERMITIDA"] }).notNull(),
  term: text("term").notNull(),
  message: text("message"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Segment Presets (Playbooks) ===
export const segmentPresets = pgTable("segment_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  segment: text("segment").notNull().unique(),
  cnaes: text("cnaes").array(),
  keywords: text("keywords").array(),
  pitchHint: text("pitch_hint"),
  commonPains: text("common_pains").array(),
  proofsBenefits: text("proofs_benefits").array(),
  recommendedCta: text("recommended_cta"),
  objections: jsonb("objections").$type<Array<{ objection: string; response: string }>>(),
  readyPhrases: text("ready_phrases").array(),
  priorityBoost: integer("priority_boost").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === Lead Batches (Lead Generator) ===
export const leadBatches = pgTable("lead_batches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  presetId: integer("preset_id"),
  status: text("status", { enum: ["PENDENTE", "PROCESSANDO", "CONCLUIDO", "ERRO"] }).default("PENDENTE"),
  filters: jsonb("filters").$type<{
    segment?: string;
    cnaes?: string[];
    city?: string;
    state?: string;
    daysBack?: number;
  }>(),
  totalFound: integer("total_found").default(0),
  totalImported: integer("total_imported").default(0),
  totalDuplicates: integer("total_duplicates").default(0),
  totalErrors: integer("total_errors").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// === Proposals / Prompts / Templates ===
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  plan: text("plan", { enum: ["STARTER", "BUSINESS", "PRO"] }).notNull(),
  status: text("status", { enum: ["DRAFT", "SENT", "ACCEPTED", "EXPIRED"] }).notNull().default("DRAFT"),
  value: integer("value").notNull().default(0),
  publicToken: text("public_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow()
});

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  input: jsonb("input").$type<Record<string, any>>(),
  templateId: integer("template_id"),
  finalPrompt: text("final_prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const promptVersions = pgTable("prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").notNull(),
  version: integer("version").notNull().default(1),
  final: text("final").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const siteTemplates = pgTable("site_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan", { enum: ["STARTER", "BUSINESS", "PRO"] }).notNull(),
  segment: text("segment"),
  version: integer("version").default(1),
  status: text("status", { enum: ["ACTIVE", "DEPRECATED"] }).notNull().default("ACTIVE"),
  content: jsonb("content").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow()
});

// === Zod Schemas ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, priorityScore: true, attempts: true, assignedToId: true });
export const insertCallLogSchema = createInsertSchema(callLogs).omit({ id: true, createdAt: true });
export const insertDiagnosisSchema = createInsertSchema(diagnosis).omit({ id: true, createdAt: true, maturityScore: true, whatsappMessage: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true });
export const insertDealUpdateSchema = createInsertSchema(dealUpdates).omit({ id: true, createdAt: true });
export const insertHandoffSchema = createInsertSchema(handoffs).omit({ id: true, createdAt: true });
export const insertProductionTaskSchema = createInsertSchema(productionTasks).omit({ id: true, createdAt: true });
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({ id: true, createdAt: true });

// New table schemas
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRuleSchema = createInsertSchema(rules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSegmentPresetSchema = createInsertSchema(segmentPresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadBatchSchema = createInsertSchema(leadBatches).omit({ id: true, createdAt: true, completedAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, publicToken: true });
export const insertPromptSchema = createInsertSchema(prompts).omit({ id: true, createdAt: true });
export const insertPromptVersionSchema = createInsertSchema(promptVersions).omit({ id: true, createdAt: true });
export const insertSiteTemplateSchema = createInsertSchema(siteTemplates).omit({ id: true, createdAt: true, version: true });

// === Types ===
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type CallLog = typeof callLogs.$inferSelect;
export type Diagnosis = typeof diagnosis.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type DealUpdate = typeof dealUpdates.$inferSelect;
export type Handoff = typeof handoffs.$inferSelect;
export type ProductionTask = typeof productionTasks.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;

// New types
export type Settings = typeof settings.$inferSelect;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type SegmentPreset = typeof segmentPresets.$inferSelect;
export type LeadBatch = typeof leadBatches.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type InsertDiagnosis = z.infer<typeof insertDiagnosisSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type InsertDealUpdate = z.infer<typeof insertDealUpdateSchema>;
export type InsertHandoff = z.infer<typeof insertHandoffSchema>;
export type InsertProductionTask = z.infer<typeof insertProductionTaskSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type InsertSegmentPreset = z.infer<typeof insertSegmentPresetSchema>;
export type InsertLeadBatch = z.infer<typeof insertLeadBatchSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type SiteTemplate = typeof siteTemplates.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type InsertPromptVersion = z.infer<typeof insertPromptVersionSchema>;
export type InsertSiteTemplate = z.infer<typeof insertSiteTemplateSchema>;

// === Loss Reason enum for frontend ===
export const LOSS_REASONS = [
  { value: "SEM_ORCAMENTO", label: "Sem orçamento" },
  { value: "JA_TEM_FORNECEDOR", label: "Já tem fornecedor" },
  { value: "SEM_INTERESSE", label: "Sem interesse" },
  { value: "NAO_E_PRIORIDADE", label: "Não é prioridade" },
  { value: "CONTATO_INVALIDO", label: "Contato inválido" },
  { value: "OUTRO", label: "Outro" },
] as const;

// === Delivery Checklist default items ===
export const DEFAULT_DELIVERY_CHECKLIST = {
  dominio: false,
  hospedagem: false,
  whatsapp: false,
  seoBasico: false,
  performance: false,
};

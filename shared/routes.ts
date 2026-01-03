import { z } from "zod";
import { 
  insertUserSchema, insertLeadSchema, insertCallLogSchema, 
  insertDiagnosisSchema, insertDealSchema, insertHandoffSchema, 
  insertProductionTaskSchema, insertSupportTicketSchema,
  insertSettingsSchema, insertMessageTemplateSchema, insertRuleSchema, insertSegmentPresetSchema,
  leads, callLogs, diagnosis, deals, handoffs, productionTasks, supportTickets,
  settings, messageTemplates, rules, segmentPresets
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.any(),
        401: errorSchemas.validation,
      }
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: { 200: z.void() }
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.any(),
      }
    }
  },
  leads: {
    list: {
      method: "GET" as const,
      path: "/api/leads",
      input: z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        userId: z.coerce.number().optional(),
        possibleDuplicate: z.coerce.boolean().optional()
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>())
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/leads",
      input: insertLeadSchema,
      responses: {
        201: z.custom<typeof leads.$inferSelect>()
      }
    },
    import: {
      method: "POST" as const,
      path: "/api/leads/import",
      input: z.array(z.any()),
      responses: {
        200: z.object({ imported: z.number(), duplicates: z.number(), errors: z.number() })
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/leads/:id",
      responses: {
        200: z.custom<typeof leads.$inferSelect>(),
        404: errorSchemas.notFound
      }
    },
    update: {
      method: "PATCH" as const,
      path: "/api/leads/:id",
      input: insertLeadSchema.partial(),
      responses: {
        200: z.custom<typeof leads.$inferSelect>(),
        404: errorSchemas.notFound
      }
    },
    next: {
      method: "GET" as const,
      path: "/api/leads/next",
      responses: {
        200: z.custom<typeof leads.$inferSelect>().nullable(),
      }
    },
    duplicates: {
      method: "GET" as const,
      path: "/api/leads/duplicates",
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>())
      }
    },
    resolveDuplicate: {
      method: "POST" as const,
      path: "/api/leads/:id/resolve-duplicate",
      input: z.object({
        action: z.enum(["ignore", "merge"]),
        mergeWithId: z.number().optional()
      }),
      responses: {
        200: z.custom<typeof leads.$inferSelect>()
      }
    }
  },
  calls: {
    create: {
      method: "POST" as const,
      path: "/api/calls",
      input: insertCallLogSchema,
      responses: {
        201: z.custom<typeof callLogs.$inferSelect>()
      }
    },
    list: {
      method: "GET" as const,
      path: "/api/leads/:id/calls",
      responses: {
        200: z.array(z.custom<typeof callLogs.$inferSelect>())
      }
    }
  },
  diagnosis: {
    create: {
      method: "POST" as const,
      path: "/api/diagnosis",
      input: insertDiagnosisSchema,
      responses: {
        201: z.custom<typeof diagnosis.$inferSelect>()
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/leads/:id/diagnosis",
      responses: {
        200: z.array(z.custom<typeof diagnosis.$inferSelect>())
      }
    }
  },
  deals: {
    create: {
      method: "POST" as const,
      path: "/api/deals",
      input: insertDealSchema,
      responses: {
        201: z.custom<typeof deals.$inferSelect>()
      }
    },
    update: {
      method: "PATCH" as const,
      path: "/api/deals/:id",
      input: insertDealSchema.partial(),
      responses: {
        200: z.custom<typeof deals.$inferSelect>()
      }
    },
    list: {
      method: "GET" as const,
      path: "/api/deals",
      responses: {
        200: z.array(z.custom<typeof deals.$inferSelect>())
      }
    }
  },
  handoffs: {
    create: {
      method: "POST" as const,
      path: "/api/handoffs",
      input: insertHandoffSchema,
      responses: {
        201: z.custom<typeof handoffs.$inferSelect>()
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/deals/:id/handoff",
      responses: {
        200: z.custom<typeof handoffs.$inferSelect>().nullable()
      }
    }
  },
  production: {
    list: {
      method: "GET" as const,
      path: "/api/production",
      responses: {
        200: z.array(z.any())
      }
    },
    update: {
      method: "PATCH" as const,
      path: "/api/production/:id",
      input: insertProductionTaskSchema.partial(),
      responses: {
        200: z.custom<typeof productionTasks.$inferSelect>()
      }
    }
  },
  support: {
    list: {
      method: "GET" as const,
      path: "/api/support",
      responses: {
        200: z.array(z.custom<typeof supportTickets.$inferSelect>())
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/support",
      input: insertSupportTicketSchema,
      responses: {
        201: z.custom<typeof supportTickets.$inferSelect>()
      }
    },
    update: {
      method: "PATCH" as const,
      path: "/api/support/:id",
      input: insertSupportTicketSchema.partial(),
      responses: {
        200: z.custom<typeof supportTickets.$inferSelect>()
      }
    }
  },
  dashboard: {
    stats: {
      method: "GET" as const,
      path: "/api/stats",
      responses: {
        200: z.object({
          leads: z.number(),
          calls: z.number(),
          sales: z.number(),
          revenue: z.number(),
          conversionRate: z.number()
        })
      }
    },
    lossStats: {
      method: "GET" as const,
      path: "/api/stats/losses",
      responses: {
        200: z.array(z.object({
          reason: z.string(),
          count: z.number(),
          segment: z.string().nullable()
        }))
      }
    }
  },
  settings: {
    list: {
      method: "GET" as const,
      path: "/api/settings",
      responses: {
        200: z.array(z.custom<typeof settings.$inferSelect>())
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/settings/:key",
      responses: {
        200: z.custom<typeof settings.$inferSelect>().nullable()
      }
    },
    set: {
      method: "PUT" as const,
      path: "/api/settings/:key",
      input: z.object({
        value: z.string(),
        description: z.string().optional()
      }),
      responses: {
        200: z.custom<typeof settings.$inferSelect>()
      }
    }
  },
  messageTemplates: {
    list: {
      method: "GET" as const,
      path: "/api/message-templates",
      responses: {
        200: z.array(z.custom<typeof messageTemplates.$inferSelect>())
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/message-templates/:id",
      responses: {
        200: z.custom<typeof messageTemplates.$inferSelect>()
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/message-templates",
      input: insertMessageTemplateSchema,
      responses: {
        201: z.custom<typeof messageTemplates.$inferSelect>()
      }
    },
    update: {
      method: "PUT" as const,
      path: "/api/message-templates/:id",
      input: insertMessageTemplateSchema.partial(),
      responses: {
        200: z.custom<typeof messageTemplates.$inferSelect>()
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/message-templates/:id",
      responses: {
        204: z.void()
      }
    }
  },
  rules: {
    list: {
      method: "GET" as const,
      path: "/api/rules",
      responses: {
        200: z.array(z.custom<typeof rules.$inferSelect>())
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/rules/:id",
      responses: {
        200: z.custom<typeof rules.$inferSelect>()
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/rules",
      input: insertRuleSchema,
      responses: {
        201: z.custom<typeof rules.$inferSelect>()
      }
    },
    update: {
      method: "PUT" as const,
      path: "/api/rules/:id",
      input: insertRuleSchema.partial(),
      responses: {
        200: z.custom<typeof rules.$inferSelect>()
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/rules/:id",
      responses: {
        204: z.void()
      }
    }
  },
  segmentPresets: {
    list: {
      method: "GET" as const,
      path: "/api/segment-presets",
      responses: {
        200: z.array(z.custom<typeof segmentPresets.$inferSelect>())
      }
    },
    get: {
      method: "GET" as const,
      path: "/api/segment-presets/:id",
      responses: {
        200: z.custom<typeof segmentPresets.$inferSelect>()
      }
    },
    getBySegment: {
      method: "GET" as const,
      path: "/api/segment-presets/by-segment/:segment",
      responses: {
        200: z.custom<typeof segmentPresets.$inferSelect>().nullable()
      }
    },
    create: {
      method: "POST" as const,
      path: "/api/segment-presets",
      input: insertSegmentPresetSchema,
      responses: {
        201: z.custom<typeof segmentPresets.$inferSelect>()
      }
    },
    update: {
      method: "PUT" as const,
      path: "/api/segment-presets/:id",
      input: insertSegmentPresetSchema.partial(),
      responses: {
        200: z.custom<typeof segmentPresets.$inferSelect>()
      }
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/segment-presets/:id",
      responses: {
        204: z.void()
      }
    }
  },
  checkProhibited: {
    check: {
      method: "POST" as const,
      path: "/api/check-prohibited",
      input: z.object({ text: z.string() }),
      responses: {
        200: z.object({
          hasProhibited: z.boolean(),
          term: z.string().nullable()
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

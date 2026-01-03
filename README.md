# Presttech Ops Console

## Visao Geral

O **Presttech Ops Console** e uma plataforma de operacoes de vendas B2B desenvolvida para otimizar cold calling e vendas para empresas recem-registradas no Brasil (CNPJs). O sistema gerencia o funil de vendas completo, desde a geracao de leads ate a entrega em producao, com controle de acesso baseado em funcao para SDR (Sales Development Representatives) e HEAD (gestores).

## Proposta e Objetivo

O sistema foi projetado para:
- **Maximizar a produtividade de SDRs** com automacao inteligente e fluxos de trabalho otimizados
- **Prevenir ligacoes duplicadas** entre diferentes SDRs atraves de atribuicao automatica
- **Padronizar o processo de vendas** com scripts guiados e tratamento de objecoes
- **Mensurar performance individual** com metricas e rankings por SDR
- **Garantir conformidade LGPD** com gestao de opt-out e privacidade

## Funcionalidades Principais

### Gestao de Leads
- Importacao via CSV e JSON
- Geracao automatica via API Casa dos Dados (CNPJs reais brasileiros)
- Presets de busca configuráveis por segmento
- Deteccao e resolucao de duplicatas
- Atribuicao automatica na primeira ligacao

### Tela de Ligacao Guiada
- Scripts personalizados por segmento de mercado
- Biblioteca de tratamento de objecoes
- Hotkeys para navegacao rapida (1-5 para resultados, N para notas, Escape para voltar)
- Integracao com MicroSIP (copia numero para clipboard)
- Historico completo de interacoes

### Diagnostico e Scoring
- Avaliacao de maturidade tecnologica em 8 dimensoes
- Calculo automatico de score (0-10)
- Recomendacao de pacote baseada no score:
  - Score < 4: STARTER
  - Score 4-7: BUSINESS
  - Score 8+: TECHPRO

### Gestao de Negocios (Deals)
- Pipeline visual com status de progresso
- Timeline de atualizacoes por negocio
- Sincronizacao automatica de status com leads
- Campos para valor, notas e motivo de perda

### Quadro de Producao (Kanban)
- Gestao visual de tarefas pos-venda
- Colunas: Pendente, Em Andamento, Concluido
- Drag-and-drop para movimentacao
- Vinculacao com deals

### Sistema de Tickets de Suporte
- Abertura de chamados pelos usuarios
- Atribuicao e acompanhamento
- Historico de resolucoes

### Painel Administrativo (HEAD)
- Dashboard com metricas globais e individuais
- Ranking de SDRs por vendas, receita e conversao
- Gestao de usuarios
- Configuracao de templates de mensagem
- Regras de negocio (termos proibidos/permitidos)
- Modo recesso com data de retorno

## Stack Tecnologica

### Frontend
| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Tipagem estatica |
| Vite | 5.x | Build tool e dev server |
| TanStack Query | 5.x | Gerenciamento de estado server-side |
| Wouter | 3.x | Roteamento SPA |
| Tailwind CSS | 4.x | Estilizacao |
| shadcn/ui | - | Componentes UI (Radix primitives) |
| React Hook Form | 7.x | Formularios |
| Zod | 3.x | Validacao de schemas |
| Recharts | 2.x | Graficos e visualizacoes |
| Lucide React | - | Icones |
| Framer Motion | - | Animacoes |

### Backend
| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Express | 4.x | Framework web |
| TypeScript | 5.x | Tipagem estatica |
| Passport.js | 0.7.x | Autenticacao |
| express-session | 1.x | Gerenciamento de sessoes |
| Multer | 1.x | Upload de arquivos |
| csv-parse | 5.x | Parsing de CSV |

### Banco de Dados
| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| PostgreSQL | 14+ | Banco de dados principal |
| Drizzle ORM | 0.x | ORM e migrations |
| drizzle-zod | 0.x | Integracao Zod com Drizzle |
| connect-pg-simple | - | Session store PostgreSQL |

### Ferramentas de Build
| Tecnologia | Proposito |
|------------|-----------|
| esbuild | Bundling do servidor |
| Vite | Bundling do cliente |
| tsx | Execucao TypeScript em dev |

## Estrutura do Projeto

```
presttech-ops-console/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizaveis
│   │   │   └── ui/           # Componentes shadcn/ui
│   │   ├── hooks/            # Custom hooks (queries, mutations)
│   │   ├── lib/              # Utilitarios e configuracoes
│   │   ├── pages/            # Paginas da aplicacao
│   │   ├── App.tsx           # Componente raiz com rotas
│   │   ├── index.css         # Estilos globais e variaveis CSS
│   │   └── main.tsx          # Entry point
│   └── index.html
├── server/                    # Backend Express
│   ├── index.ts              # Entry point do servidor
│   ├── routes.ts             # Definicao de rotas API
│   ├── storage.ts            # Interface de acesso ao banco
│   ├── auth.ts               # Configuracao de autenticacao
│   ├── db.ts                 # Conexao com PostgreSQL
│   ├── vite.ts               # Integracao Vite dev server
│   └── services/
│       └── casaDosdados.ts   # Integracao API Casa dos Dados
├── shared/                    # Codigo compartilhado
│   ├── schema.ts             # Schemas Drizzle + tipos Zod
│   └── routes.ts             # Contrato de API
├── scripts/
│   └── create-user.js        # Script para criar usuarios
├── drizzle.config.ts         # Configuracao Drizzle Kit
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── INSTALL.md                # Instrucoes de instalacao
└── README.md                 # Este arquivo
```

## Modelo de Dados

### Tabelas Principais

- **users**: Usuarios do sistema (SDR/HEAD)
- **leads**: Empresas prospectadas
- **call_logs**: Historico de ligacoes
- **diagnoses**: Avaliacoes de maturidade
- **deals**: Negocios em andamento
- **deal_updates**: Timeline de atualizacoes dos deals
- **tasks**: Tarefas de producao
- **tickets**: Chamados de suporte
- **message_templates**: Templates de mensagem por categoria
- **rules**: Regras de negocio (termos proibidos/permitidos)
- **settings**: Configuracoes do sistema
- **sales_presets**: Presets de busca de leads
- **lead_batches**: Lotes de geracao de leads

## Variaveis de Ambiente

| Variavel | Obrigatoria | Descricao |
|----------|-------------|-----------|
| DATABASE_URL | Sim | String de conexao PostgreSQL |
| SESSION_SECRET | Sim | Chave para criptografia de sessoes |
| CASA_API_KEY | Nao | Chave API Casa dos Dados (geracao de leads) |
| NODE_ENV | Nao | Ambiente (development/production) |
| PORT | Nao | Porta do servidor (padrao: 5000) |

## Perfis de Usuario

### SDR (Sales Development Representative)
- Acesso a leads atribuidos ou nao-atribuidos
- Tela de ligacao guiada
- Diagnostico de leads
- Criacao de deals
- Visualizacao de metricas pessoais

### HEAD (Gestor)
- Todas as permissoes de SDR
- Dashboard completo com metricas globais
- Gestao de usuarios
- Configuracao de templates e regras
- Ranking de performance de SDRs
- Configuracoes do sistema (modo recesso, etc)

## Fluxo de Trabalho Principal

1. **Geracao/Importacao de Leads** → Leads entram com status NOVO
2. **Atribuicao Automatica** → Na primeira ligacao, lead e atribuido ao SDR
3. **Ligacao Guiada** → SDR usa script e registra resultado
4. **Agendamento de Diagnostico** → Se interessado, agenda avaliacao
5. **Diagnostico** → Avaliacao de 8 dimensoes com scoring
6. **Criacao de Deal** → Automatica apos diagnostico com pacote recomendado
7. **Negociacao** → Acompanhamento via timeline de updates
8. **Fechamento** → Status FECHADO sincroniza lead para VENDIDO
9. **Producao** → Tarefas no quadro Kanban para entrega

## Seguranca

- Senhas hasheadas com scrypt (crypto nativo)
- Sessoes armazenadas em PostgreSQL
- Middleware de autenticacao em todas as rotas API
- Verificacao de perfil (requireHead) para rotas administrativas
- Validacao de entrada com Zod em todas as rotas
- Deteccao de termos proibidos em notas de ligacao

## APIs Externas

### Casa dos Dados API
- Endpoint: https://api.casadosdados.com.br/v2
- Funcionalidade: Busca de CNPJs por filtros (segmento, cidade, estado, CNAEs)
- Autenticacao: API Key no header
- Rate limit: Respeitado pelo sistema

## Melhorias Futuras Opcionais

### Curto Prazo
- [ ] Exportacao de relatorios em PDF/Excel
- [ ] Notificacoes push para followups agendados
- [ ] Integracao com WhatsApp Business API
- [ ] Gravacao de ligacoes (integracao VoIP)

### Medio Prazo
- [ ] Dashboard de analytics avancado com BI
- [ ] Automacao de emails com templates
- [ ] Integracao com CRMs externos (Pipedrive, HubSpot)
- [ ] App mobile para SDRs em campo
- [ ] Webhooks para integracao com sistemas externos

### Longo Prazo
- [ ] IA para scoring preditivo de leads
- [ ] Chatbot para qualificacao inicial
- [ ] Analise de sentimento em ligacoes
- [ ] Multi-tenancy para diferentes empresas
- [ ] Marketplace de integracoes

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build de producao
npm run build            # Gera bundle de producao

# Banco de dados
npm run db:push          # Aplica schema ao banco

# Criar usuario
node scripts/create-user.js  # Cria usuario via CLI
```

## Suporte e Contato

Para duvidas sobre o projeto ou contribuicoes, consulte a documentacao interna ou entre em contato com a equipe de desenvolvimento.

---

**Versao**: 1.0.0  
**Ultima Atualizacao**: Janeiro 2026  
**Licenca**: Proprietaria

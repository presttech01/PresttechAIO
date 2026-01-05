interface CasaDadosCompany {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  telefone?: string;
  telefone_1?: string;
  telefone_2?: string;
  municipio?: string;
  uf?: string;
  cnae_principal?: string;
  data_abertura?: string;
}

interface CasaDadosResponse {
  data: CasaDadosCompany[];
  count: number;
  page: number;
  pages: number;
}

interface SearchFilters {
  cnaes?: string[];
  city?: string;
  state?: string;
  daysBack?: number;
  limit?: number;
  page?: number;
}

export interface NormalizedLead {
  companyName: string;
  phoneRaw: string;
  phoneNorm: string;
  cnpj: string;
  segment?: string;
  city?: string;
  state?: string;
  openingDate?: Date;
}

function normalizePhone(phone: string | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(ltda|me|epp|sa|s\/a|eireli|ss|sociedade|empresarial)\b/gi, "")
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeCompanyName(str1);
  const s2 = normalizeCompanyName(str2);
  
  if (s1 === s2) return 1;
  
  const tokens1 = s1.split(" ").filter(t => t.length > 2);
  const tokens2 = s2.split(" ").filter(t => t.length > 2);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  const intersection = tokens1.filter(t => tokens2.includes(t));
  const union = [...new Set([...tokens1, ...tokens2])];
  
  return intersection.length / union.length;
}

export class CasaDadosService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.CASA_API_KEY || "";
    this.baseUrl = process.env.CASA_BASE_URL || "https://api.casadosdados.com.br";
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async searchCompanies(filters: SearchFilters): Promise<CasaDadosResponse> {
    if (this.isConfigured()) {
      try {
        return await this.searchCasaDados(filters);
      } catch (error) {
        console.error("Casa dos Dados API error:", error);
      }
    }
    
    try {
      return await this.searchCnpjWs(filters);
    } catch (error) {
      console.error("CNPJ.ws API error:", error);
    }
    
    throw new Error("API_NOT_CONFIGURED: Para buscar empresas reais, configure a chave CASA_API_KEY ou utilize a API pública do CNPJ.ws (limitada a 3 req/min).");
  }
  
  private async searchCasaDados(filters: SearchFilters): Promise<CasaDadosResponse> {
    const body: any = {
      situacao_cadastral: ["ATIVA"],
      matriz_filial: "MATRIZ",
      com_contato_telefonico: true,
      somente_mei: false,
      excluir_mei: false,
      page: filters.page || 1
    };
    
    if (filters.cnaes?.length) {
      body.codigo_atividade_principal = filters.cnaes;
    }
    
    if (filters.city) {
      body.municipio = [filters.city.toLowerCase()];
    }
    
    if (filters.state) {
      body.uf = [filters.state.toLowerCase()];
    }
    
    if (filters.daysBack) {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - filters.daysBack);
      const dateTo = new Date();
      body.data_abertura = {
        inicio: dateFrom.toISOString().split("T")[0],
        fim: dateTo.toISOString().split("T")[0]
      };
    }
    
    const response = await fetch(`${this.baseUrl}/v5/cnpj/pesquisa`, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Casa dos Dados API error: ${response.status} - ${text}`);
    }
    
    const result = await response.json();
    const cnpjList = result.cnpjs || result.data?.cnpjs || [];
    const limitedCnpjs = cnpjList.slice(0, filters.limit || 50);
    
    const enrichedCompanies = await Promise.all(
      limitedCnpjs.map(async (item: any) => {
        const cnpjValue = typeof item === "string" ? item : (item.cnpj || item);
        try {
          const details = await this.getCnpjDetails(cnpjValue);
          return details;
        } catch {
          const src = typeof item === "string" ? {} : item;
          return {
            cnpj: cnpjValue,
            razao_social: src.razao_social || undefined,
            nome_fantasia: src.nome_fantasia || undefined,
            telefone: src.telefone || src.telefone_1 || src.telefone_2 || undefined,
            telefone_1: src.telefone_1,
            telefone_2: src.telefone_2,
            municipio: src.endereco?.municipio || src.municipio,
            uf: src.endereco?.uf || src.uf,
            cnae_principal: src.atividade_principal?.descricao || src.cnae_principal,
            data_abertura: src.data_abertura
          };
        }
      })
    );
    
    return {
      data: enrichedCompanies.filter(c => c.telefone || c.telefone_1 || c.telefone_2),
      count: result.total || cnpjList.length,
      page: filters.page || 1,
      pages: Math.ceil((result.total || cnpjList.length) / 20)
    };
  }
  
  private async getCnpjDetails(cnpj: string): Promise<CasaDadosCompany> {
    const response = await fetch(`${this.baseUrl}/v4/cnpj/${cnpj.replace(/\D/g, "")}`, {
      headers: {
        "api-key": this.apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`CNPJ lookup failed: ${response.status}`);
    }
    
    const c = await response.json();
    const telefones = c.contato_telefonico || [];
    const tel1 = telefones[0] ? `(${telefones[0].ddd}) ${telefones[0].numero}` : undefined;
    const tel2 = telefones[1] ? `(${telefones[1].ddd}) ${telefones[1].numero}` : undefined;
    
    return {
      cnpj: c.cnpj,
      razao_social: c.razao_social,
      nome_fantasia: c.nome_fantasia,
      telefone: tel1 || tel2,
      telefone_1: tel1,
      telefone_2: tel2,
      municipio: c.endereco?.municipio,
      uf: c.endereco?.uf,
      cnae_principal: c.atividade_principal?.descricao,
      data_abertura: c.data_abertura
    };
  }
  
  private async searchCnpjWs(filters: SearchFilters): Promise<CasaDadosResponse> {
    const params = new URLSearchParams();
    
    if (filters.state) {
      params.append("uf", filters.state);
    }
    if (filters.city) {
      params.append("municipio", filters.city);
    }
    if (filters.cnaes?.length) {
      params.append("cnaes", filters.cnaes[0]);
    }
    
    params.append("situacao_cadastral", "ATIVA");
    params.append("somente_matriz", "true");
    params.append("com_contato_telefonico", "true");
    params.append("ordem", "DATA_ABERTURA");
    params.append("pagina", String(filters.page || 1));
    
    const response = await fetch(`https://publica.cnpj.ws/cnpj?${params.toString()}`, {
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("RATE_LIMIT: Limite de requisições excedido. Aguarde 1 minuto.");
      }
      throw new Error(`CNPJ.ws API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    const companies = (result.estabelecimentos || []).filter((e: any) => {
      if (!e.ddd_telefone_1 && !e.ddd_telefone_2) return false;
      
      if (filters.daysBack) {
        const openDate = new Date(e.data_inicio_atividade);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.daysBack);
        if (openDate < cutoffDate) return false;
      }
      
      return true;
    });
    
    return {
      data: companies.slice(0, filters.limit || 50).map((e: any) => ({
        cnpj: e.cnpj,
        razao_social: e.razao_social,
        nome_fantasia: e.nome_fantasia,
        telefone: e.ddd_telefone_1 ? `(${e.ddd_telefone_1}) ${e.telefone_1}` : (e.ddd_telefone_2 ? `(${e.ddd_telefone_2}) ${e.telefone_2}` : ""),
        telefone_1: e.ddd_telefone_1 ? `(${e.ddd_telefone_1}) ${e.telefone_1}` : undefined,
        telefone_2: e.ddd_telefone_2 ? `(${e.ddd_telefone_2}) ${e.telefone_2}` : undefined,
        municipio: e.cidade?.nome,
        uf: e.estado?.sigla,
        cnae_principal: e.atividade_principal?.id,
        data_abertura: e.data_inicio_atividade
      })),
      count: result.total || companies.length,
      page: filters.page || 1,
      pages: result.total_pages || 1
    };
  }
  
  normalizeCompanies(companies: CasaDadosCompany[], segment?: string): NormalizedLead[] {
    return companies
      .filter(c => c.telefone || c.telefone_1 || c.telefone_2)
      .map(c => {
        const phone = c.telefone || c.telefone_1 || c.telefone_2 || "";
        return {
          companyName: c.nome_fantasia || c.razao_social,
          phoneRaw: phone,
          phoneNorm: normalizePhone(phone),
          cnpj: (c.cnpj || "").replace(/\D/g, ""),
          segment,
          city: c.municipio,
          state: c.uf,
          openingDate: c.data_abertura ? new Date(c.data_abertura) : undefined
        };
      })
      .filter(l => l.phoneNorm.length >= 10);
  }
  
  checkDuplicate(lead: NormalizedLead, existingLeads: Array<{ phoneNorm: string | null; cnpj: string | null; companyName: string; city: string | null; state: string | null }>): boolean {
    for (const existing of existingLeads) {
      if (lead.phoneNorm && existing.phoneNorm && lead.phoneNorm === existing.phoneNorm) {
        return true;
      }
      
      if (lead.cnpj && existing.cnpj && lead.cnpj === existing.cnpj) {
        return true;
      }
      
      if (lead.city && lead.state && existing.city && existing.state) {
        if (lead.city.toLowerCase() === existing.city.toLowerCase() && 
            lead.state.toUpperCase() === existing.state.toUpperCase()) {
          const similarity = calculateSimilarity(lead.companyName, existing.companyName);
          if (similarity > 0.7) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
}

export const casaDadosService = new CasaDadosService();

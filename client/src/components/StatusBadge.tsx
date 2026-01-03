import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  // Leads
  NOVO: "bg-blue-100 text-blue-700 border-blue-200",
  TENTATIVA: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CONTATO_REALIZADO: "bg-indigo-100 text-indigo-700 border-indigo-200",
  DIAGNOSTICO_AGENDADO: "bg-purple-100 text-purple-700 border-purple-200",
  PROPOSTA_ENVIADA: "bg-orange-100 text-orange-700 border-orange-200",
  VENDIDO: "bg-green-100 text-green-700 border-green-200",
  PERDIDO: "bg-red-100 text-red-700 border-red-200",
  
  // Production
  AGUARDANDO_MATERIAIS: "bg-slate-100 text-slate-700 border-slate-200",
  EM_PRODUCAO: "bg-blue-100 text-blue-700 border-blue-200",
  EM_REVISAO: "bg-amber-100 text-amber-700 border-amber-200",
  ENTREGUE: "bg-green-100 text-green-700 border-green-200",
  PAUSADO: "bg-red-50 text-red-700 border-red-200",

  // Priority
  ALTA: "bg-red-100 text-red-700 border-red-200",
  MEDIA: "bg-yellow-100 text-yellow-700 border-yellow-200",
  BAIXA: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  // Map Portuguese translations
  const translations: Record<string, string> = {
    NOVO: "Novo",
    TENTATIVA: "Tentativa",
    CONTATO_REALIZADO: "Contato Realizado",
    DIAGNOSTICO_AGENDADO: "Diagnóstico Agendado",
    PROPOSTA_ENVIADA: "Proposta Enviada",
    VENDIDO: "Vendido",
    PERDIDO: "Perdido",
    OPTOUT: "Opt-out",
    NUMERO_INVALIDO: "Número Inválido",
    AGUARDANDO_MATERIAIS: "Aguardando Materiais",
    EM_PRODUCAO: "Em Produção",
    EM_REVISAO: "Em Revisão",
    ENTREGUE: "Entregue",
    PAUSADO: "Pausado",
    ALTA: "Alta",
    MEDIA: "Média",
    BAIXA: "Baixa"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variants[status] || "bg-gray-100 text-gray-800 border-gray-200",
      className
    )}>
      {translations[status] || status.replace(/_/g, " ")}
    </span>
  );
}

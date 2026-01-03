import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Copy, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";

export default function Duplicates() {
  const { toast } = useToast();

  const { data: duplicates = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", "duplicates"],
    queryFn: async () => {
      const res = await fetch("/api/leads?possibleDuplicate=true", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao buscar duplicados");
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: "keep" | "merge" | "delete" }) => {
      if (action === "keep") {
        return apiRequest("PATCH", `/api/leads/${id}`, { possibleDuplicate: false, duplicateOfId: null });
      } else if (action === "delete") {
        return apiRequest("PATCH", `/api/leads/${id}`, { status: "PERDIDO", lossReason: "CONTATO_INVALIDO" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar lead", variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      NOVO: "default",
      TENTATIVA: "secondary",
      CONTATO_REALIZADO: "secondary",
      POSSIVEL_DUPLICADO: "outline"
    };
    return variants[status] || "secondary";
  };

  const statusLabels: Record<string, string> = {
    NOVO: "Novo",
    TENTATIVA: "Tentativa",
    CONTATO_REALIZADO: "Contato Realizado",
    DIAGNOSTICO_AGENDADO: "Diagnóstico Agendado",
    PROPOSTA_ENVIADA: "Proposta Enviada",
    VENDIDO: "Vendido",
    PERDIDO: "Perdido",
    OPTOUT: "Opt-out",
    NUMERO_INVALIDO: "Número Inválido",
    POSSIVEL_DUPLICADO: "Possível Duplicado"
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
          Leads Duplicados
        </h1>
        <p className="text-slate-600">
          Revise e resolva leads marcados como possíveis duplicados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Possíveis Duplicados
            <Badge variant="secondary" className="ml-2">
              {duplicates.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Leads detectados como possíveis duplicados durante a importação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Nenhum lead duplicado encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map(lead => (
                  <TableRow key={lead.id} data-testid={`row-duplicate-${lead.id}`}>
                    <TableCell className="font-medium">{lead.companyName}</TableCell>
                    <TableCell>{lead.phoneRaw}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {lead.cnpj ? lead.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : "-"}
                    </TableCell>
                    <TableCell>{lead.city || "-"}/{lead.state || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(lead.status)}>
                        {statusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {lead.originList || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resolveMutation.mutate({ id: lead.id, action: "keep" })}
                          disabled={resolveMutation.isPending}
                          data-testid={`button-keep-${lead.id}`}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Manter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => resolveMutation.mutate({ id: lead.id, action: "delete" })}
                          disabled={resolveMutation.isPending}
                          data-testid={`button-delete-${lead.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

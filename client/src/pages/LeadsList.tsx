import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useLeads, useNextLead, useImportLeads } from "@/hooks/use-leads";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import { Search, Phone, Play, FileUp, Zap, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LeadsList() {
  const [search, setSearch] = useState("");
  const { data: leads, isLoading } = useLeads({ search });
  const nextLeadMutation = useNextLead();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await apiRequest('DELETE', `/api/leads/${leadId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ title: "Lead removido com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao remover lead", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader title="Gestão de Leads" description="Visualize e gerencie seu banco de prospects.">
        <Button 
          variant="outline"
          onClick={() => navigate("/lead-generator")}
          data-testid="button-lead-generator"
        >
          <Zap className="mr-2 h-4 w-4" />
          Gerar Novos Leads
        </Button>
        <ImportDialog />
        <Button 
          size="lg" 
          onClick={() => nextLeadMutation.mutate()}
          disabled={nextLeadMutation.isPending}
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          <Play className="mr-2 h-4 w-4" fill="currentColor" />
          Começar Ligações
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar leads..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Empresa</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade/Estado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Contato</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Carregando leads...</TableCell>
              </TableRow>
            ) : leads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhum lead encontrado.</TableCell>
              </TableRow>
            ) : (
              leads?.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{lead.companyName}</TableCell>
                  <TableCell>{lead.phoneRaw}</TableCell>
                  <TableCell>{lead.city}, {lead.state}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString('pt-BR') : 'Nunca'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/leads/${lead.id}/call`}>
                        <Button variant="ghost" size="icon" data-testid={`button-call-lead-${lead.id}`}>
                          <Phone className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-delete-lead-${lead.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Lead</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{lead.companyName}"? Esta acao nao pode ser desfeita e todos os registros de ligacoes e diagnosticos serao removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(lead.id)}
                              className="bg-destructive text-destructive-foreground"
                              data-testid={`button-confirm-delete-${lead.id}`}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ImportDialog() {
  const [jsonInput, setJsonInput] = useState("");
  const [open, setOpen] = useState(false);
  const importMutation = useImportLeads();

  const handleImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      importMutation.mutate(Array.isArray(data) ? data : [data], {
        onSuccess: () => setOpen(false)
      });
    } catch (e) {
      alert("JSON inválido");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="h-4 w-4" /> Importar JSON
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Cole o array JSON de leads aqui.</p>
          <Textarea 
            value={jsonInput} 
            onChange={(e) => setJsonInput(e.target.value)} 
            placeholder='[{"companyName": "Acme Inc", "phoneRaw": "555-0123"}]'
            className="h-[200px] font-mono text-xs"
          />
          <Button onClick={handleImport} disabled={importMutation.isPending} className="w-full">
            {importMutation.isPending ? "Importando..." : "Executar Importação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

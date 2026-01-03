import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useDealsWithLeads, useDealUpdates, useUpdateDeal, useAddDealUpdate, type DealWithLead } from "@/hooks/use-deals";
import { useToast } from "@/hooks/use-toast";
import { 
  Briefcase, DollarSign, Calendar, Building2, Loader2, 
  Eye, RefreshCw, Phone, FileText, MessageSquare, Clock, 
  ArrowRight, ExternalLink, Send 
} from "lucide-react";
import { Link } from "wouter";
import type { DealUpdate } from "@shared/schema";

const statusLabels: Record<string, string> = {
  EM_NEGOCIACAO: "Em Negociacao",
  PROPOSTA_ENVIADA: "Proposta Enviada",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  EM_NEGOCIACAO: "secondary",
  PROPOSTA_ENVIADA: "outline",
  FECHADO: "default",
  PERDIDO: "destructive",
};

const packageLabels: Record<string, string> = {
  STARTER: "Starter",
  BUSINESS: "Business",
  TECHPRO: "TechPro",
};

const updateTypeLabels: Record<string, string> = {
  STATUS_CHANGE: "Alteracao de Status",
  NOTE: "Nota",
  FOLLOWUP: "Follow-up",
};

function DealDetailsModal({ 
  deal, 
  open, 
  onOpenChange 
}: { 
  deal: DealWithLead | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const [newNote, setNewNote] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const { toast } = useToast();
  
  const { data: updates, isLoading: updatesLoading } = useDealUpdates(deal?.id || 0);
  const updateDeal = useUpdateDeal();
  const addUpdate = useAddDealUpdate();

  const handleStatusChange = async (newStatus: string) => {
    if (!deal || newStatus === deal.status) return;
    
    try {
      await updateDeal.mutateAsync({ 
        dealId: deal.id, 
        data: { status: newStatus } 
      });
      setSelectedStatus("");
      toast({ title: "Sucesso", description: "Status atualizado" });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
    }
  };

  const handleAddNote = async () => {
    if (!deal || !newNote.trim()) return;
    
    try {
      await addUpdate.mutateAsync({ 
        dealId: deal.id, 
        type: "NOTE", 
        note: newNote.trim() 
      });
      setNewNote("");
      toast({ title: "Sucesso", description: "Nota adicionada" });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao adicionar nota", variant: "destructive" });
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {deal.lead.companyName}
          </DialogTitle>
          <DialogDescription>
            Detalhes do negocio e historico de atualizacoes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium" data-testid="text-deal-cnpj">{deal.lead.cnpj || "-"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium flex items-center gap-2" data-testid="text-deal-phone">
                <Phone className="h-4 w-4" />
                {deal.lead.phoneRaw || "-"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pacote</p>
              <Badge variant="secondary" data-testid="badge-deal-package">
                {packageLabels[deal.packageSold] || deal.packageSold}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-medium font-mono" data-testid="text-deal-value">
                {formatCurrency(deal.value)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Alterar Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Select 
                value={selectedStatus} 
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger 
                  className="w-[200px]" 
                  data-testid="select-deal-status"
                >
                  <SelectValue placeholder={statusLabels[deal.status || "EM_NEGOCIACAO"]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EM_NEGOCIACAO">Em Negociacao</SelectItem>
                  <SelectItem value="PROPOSTA_ENVIADA">Proposta Enviada</SelectItem>
                  <SelectItem value="FECHADO">Fechado</SelectItem>
                  <SelectItem value="PERDIDO">Perdido</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm"
                onClick={() => handleStatusChange(selectedStatus)}
                disabled={!selectedStatus || selectedStatus === deal.status || updateDeal.isPending}
                data-testid="button-update-status"
              >
                {updateDeal.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Atualizar</span>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Adicionar Nota</p>
            <div className="space-y-2">
              <Textarea
                placeholder="Digite uma nota ou observacao..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                data-testid="textarea-deal-note"
              />
              <Button 
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || addUpdate.isPending}
                data-testid="button-add-note"
              >
                {addUpdate.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="ml-2">Enviar Nota</span>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline de Atualizacoes
            </p>
            
            {updatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !updates || updates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma atualizacao registrada.
              </p>
            ) : (
              <div className="space-y-3">
                {updates.map((update: DealUpdate) => (
                  <div 
                    key={update.id} 
                    className="border rounded-md p-3 space-y-2"
                    data-testid={`timeline-item-${update.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="outline">
                        {update.type === "STATUS_CHANGE" ? (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        ) : update.type === "NOTE" ? (
                          <MessageSquare className="h-3 w-3 mr-1" />
                        ) : (
                          <FileText className="h-3 w-3 mr-1" />
                        )}
                        {updateTypeLabels[update.type] || update.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(update.createdAt)}
                      </span>
                    </div>
                    {update.type === "STATUS_CHANGE" && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {statusLabels[update.oldStatus || ""] || update.oldStatus}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="default">
                          {statusLabels[update.newStatus || ""] || update.newStatus}
                        </Badge>
                      </div>
                    )}
                    {update.note && (
                      <p className="text-sm text-muted-foreground">{update.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-end">
            <Link href={`/leads/${deal.leadId}`}>
              <Button variant="outline" data-testid="button-view-lead">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Lead Original
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Deals() {
  const [selectedDeal, setSelectedDeal] = useState<DealWithLead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const { data: deals, isLoading } = useDealsWithLeads();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const handleViewDetails = (deal: DealWithLead) => {
    setSelectedDeal(deal);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalValue = deals?.reduce((acc, deal) => acc + (deal.value || 0), 0) || 0;
  const closedDeals = deals?.filter(d => d.status === "FECHADO") || [];
  const activeDeals = deals?.filter(d => d.status !== "FECHADO" && d.status !== "PERDIDO") || [];

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader 
        title="Negocios" 
        description="Acompanhe seus negocios em andamento e fechados."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Negocios</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-total-deals">
                  {deals?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-active-deals">
                  {activeDeals.length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fechados</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-closed-deals">
                  {closedDeals.length}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-total-value">
                  {formatCurrency(totalValue)}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Lista de Negocios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!deals || deals.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-deals">
                Nenhum negocio encontrado.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Os negocios aparecerao aqui quando voce fechar vendas com leads.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Pacote</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id} data-testid={`row-deal-${deal.id}`}>
                    <TableCell className="font-medium">
                      {deal.lead.companyName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {packageLabels[deal.packageSold] || deal.packageSold}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {deal.value ? formatCurrency(deal.value) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={deal.status ? statusColors[deal.status] || "secondary" : "secondary"}>
                        {deal.status ? statusLabels[deal.status] || deal.status : "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {deal.createdAt ? formatDate(deal.createdAt) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleViewDetails(deal)}
                        data-testid={`button-view-deal-${deal.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DealDetailsModal 
        deal={selectedDeal} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  );
}

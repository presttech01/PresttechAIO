import { useParams, useLocation } from "wouter";
import { useLead, useNextLead } from "@/hooks/use-leads";
import { useCallLogs, useCreateCallLog } from "@/hooks/use-interactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  Phone, 
  PhoneCall,
  PhoneOff,
  Copy,
  MessageCircle,
  MapPin, 
  Building2, 
  History, 
  Clock,
  Keyboard,
  ClipboardList,
  ArrowLeft
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { normalizeBRPhoneClient, dialNumber, openWhatsApp, copyToClipboard } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function LeadCall() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const leadId = Number(id);
  const { data: lead, isLoading } = useLead(leadId);
  const { data: logs } = useCallLogs(leadId);
  const logCallMutation = useCreateCallLog();
  const nextLeadMutation = useNextLead();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const normalizedPhone = lead?.phoneRaw ? normalizeBRPhoneClient(lead.phoneRaw) : null;

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = async () => {
    setIsCallActive(true);
    if (normalizedPhone?.isValid && normalizedPhone.e164) {
      const copied = await dialNumber(normalizedPhone.e164);
      if (copied) {
        toast({ title: "Número Copiado!", description: `${copied} - Cole no MicroSIP (Ctrl+V)` });
      }
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
  };

  const handleDial = async () => {
    if (normalizedPhone?.isValid && normalizedPhone.e164) {
      const copied = await dialNumber(normalizedPhone.e164);
      if (copied) {
        toast({ title: "Número Copiado!", description: `${copied} - Cole no MicroSIP (Ctrl+V)` });
      } else {
        toast({ title: "Erro", description: "Não foi possível copiar o número", variant: "destructive" });
      }
    } else {
      toast({ title: "Erro", description: "Número inválido", variant: "destructive" });
    }
  };

  const handleCopyPhone = async () => {
    if (normalizedPhone?.isValid && normalizedPhone.e164) {
      const success = await copyToClipboard(normalizedPhone.e164);
      if (success) {
        toast({ title: "Copiado", description: `Número ${normalizedPhone.e164} copiado` });
      } else {
        toast({ title: "Erro", description: "Falha ao copiar número", variant: "destructive" });
      }
    } else {
      toast({ title: "Erro", description: "Número inválido", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    if (normalizedPhone?.isValid && normalizedPhone.whatsappDigits) {
      openWhatsApp(normalizedPhone.whatsappDigits);
      toast({ title: "WhatsApp", description: "Abrindo WhatsApp Web" });
    } else {
      toast({ title: "Erro", description: "Número inválido para WhatsApp", variant: "destructive" });
    }
  };

  const handleCopySummary = async () => {
    if (!lead) return;
    const summary = `${lead.companyName} - ${lead.city}/${lead.state} - ${lead.phoneRaw}`;
    const success = await copyToClipboard(summary);
    if (success) {
      toast({ title: "Resumo Copiado", description: summary });
    } else {
      toast({ title: "Erro", description: "Falha ao copiar resumo", variant: "destructive" });
    }
  };

  const handleResult = useCallback((result: string) => {
    logCallMutation.mutate({
      leadId,
      duration,
      result,
      notes
    }, {
      onSuccess: () => {
        toast({ 
          title: "Resultado Registrado", 
          description: `${result.replace(/_/g, " ")} salvo com sucesso` 
        });
        setDuration(0);
        setNotes("");
        setIsCallActive(false);
        
        // Fluxo inteligente baseado no resultado
        if (result === 'AGENDOU_DIAGNOSTICO') {
          // Redirecionar para tela de Diagnóstico
          toast({ 
            title: "Diagnóstico Agendado", 
            description: "Redirecionando para diagnóstico..." 
          });
          setLocation(`/leads/${leadId}/diagnosis`);
        } else {
          // Navegar para próximo lead
          nextLeadMutation.mutate();
        }
      },
      onError: () => {
        toast({ 
          title: "Erro", 
          description: "Falha ao registrar resultado", 
          variant: "destructive" 
        });
      }
    });
  }, [leadId, duration, notes, logCallMutation, toast, nextLeadMutation, setLocation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        e.preventDefault();
        setLocation('/leads');
        return;
      }

      if (e.key.toLowerCase() === 'n' && !isInputFocused) {
        e.preventDefault();
        notesRef.current?.focus();
        return;
      }

      if (isInputFocused) return;

      const hotkeys: Record<string, string> = {
        '1': 'SEM_RESPOSTA',
        '2': 'CAIXA_POSTAL',
        '3': 'NUMERO_INVALIDO',
        '4': 'CONTATO_REALIZADO',
        '5': 'AGENDOU_DIAGNOSTICO'
      };

      if (hotkeys[e.key]) {
        e.preventDefault();
        handleResult(hotkeys[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResult, setLocation]);

  if (isLoading || !lead) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando contexto do lead...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6 grid grid-cols-10 gap-6">
      {/* LEFT COLUMN: Lead Info + Timer + Notes (40%) */}
      <div className="col-span-4 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/leads')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <StatusBadge status={lead.status} />
            </div>
            <CardTitle className="text-xl mt-2" data-testid="text-company-name">
              {lead.companyName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span data-testid="text-segment">{lead.segment || "Segmento não informado"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-mono" data-testid="text-phone">{lead.phoneRaw}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span data-testid="text-location">{lead.city}, {lead.state}</span>
              </div>
            </div>

            <Separator />

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDial}
                data-testid="button-dial"
              >
                <Phone className="h-4 w-4 mr-1" />
                Ligar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyPhone}
                data-testid="button-copy-phone"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Número
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleWhatsApp}
                data-testid="button-whatsapp"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopySummary}
                data-testid="button-copy-summary"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Resumo
              </Button>
            </div>

            <Separator />

            {/* Timer Control */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-lg" data-testid="text-timer">
                  {formatTime(duration)}
                </span>
              </div>
              {!isCallActive ? (
                <Button 
                  size="sm" 
                  onClick={handleStartCall}
                  data-testid="button-start-call"
                >
                  <PhoneCall className="h-4 w-4 mr-1" />
                  Iniciar Chamada
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleEndCall}
                  data-testid="button-end-call"
                >
                  <PhoneOff className="h-4 w-4 mr-1" />
                  Encerrar Chamada
                </Button>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <h4 className="text-sm font-medium mb-2">Anotações da Ligação</h4>
              <Textarea 
                ref={notesRef}
                placeholder="Digite anotações durante a ligação..." 
                className="min-h-[100px] resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>

            {/* Link to Diagnosis */}
            <Link href={`/leads/${lead.id}/diagnosis`}>
              <Button variant="outline" className="w-full gap-2" data-testid="button-diagnosis">
                <ClipboardList className="h-4 w-4" />
                Abrir Formulário de Diagnóstico
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Hotkeys Legend */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Atalhos de Teclado
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span><kbd className="px-1 rounded bg-muted font-mono">1</kbd> Sem Resposta</span>
              <span><kbd className="px-1 rounded bg-muted font-mono">2</kbd> Caixa Postal</span>
              <span><kbd className="px-1 rounded bg-muted font-mono">3</kbd> Número Inválido</span>
              <span><kbd className="px-1 rounded bg-muted font-mono">4</kbd> Contatado</span>
              <span><kbd className="px-1 rounded bg-muted font-mono">5</kbd> Agendou</span>
              <span><kbd className="px-1 rounded bg-muted font-mono">N</kbd> Foco em Notas</span>
              <span className="col-span-2"><kbd className="px-1 rounded bg-muted font-mono">Esc</kbd> Voltar para lista</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Actions + History (60%) */}
      <div className="col-span-6 flex flex-col gap-4">
        {/* Result Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registrar Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleResult("SEM_RESPOSTA")}
                disabled={logCallMutation.isPending}
                data-testid="button-result-sem-resposta"
              >
                Sem Resposta
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleResult("CAIXA_POSTAL")}
                disabled={logCallMutation.isPending}
                data-testid="button-result-caixa-postal"
              >
                Caixa Postal
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleResult("NUMERO_INVALIDO")}
                disabled={logCallMutation.isPending}
                data-testid="button-result-numero-invalido"
              >
                Número Inválido
              </Button>
              <Button 
                onClick={() => handleResult("CONTATO_REALIZADO")}
                disabled={logCallMutation.isPending}
                data-testid="button-result-contato-realizado"
              >
                Contatado
              </Button>
              <Button 
                className="col-span-2 bg-green-600 dark:bg-green-700"
                onClick={() => handleResult("AGENDOU_DIAGNOSTICO")}
                disabled={logCallMutation.isPending}
                data-testid="button-result-agendou-diagnostico"
              >
                Agendou Diagnóstico
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Interações
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-[400px] px-6">
              <div className="space-y-4 pb-4">
                {logs?.map((log) => (
                  <div key={log.id} className="relative pl-4 border-l-2 border-muted" data-testid={`log-entry-${log.id}`}>
                    <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-muted-foreground/40 ring-4 ring-background" />
                    <p className="text-xs text-muted-foreground font-mono mb-1">
                      {new Date(log.createdAt!).toLocaleString('pt-BR')}
                    </p>
                    <p className="font-medium text-sm">{log.result.replace(/_/g, " ")}</p>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded">
                        {log.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Duração: {Math.floor((log.duration || 0) / 60)}:{((log.duration || 0) % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                ))}
                {(!logs || logs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma interação anterior com este lead.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

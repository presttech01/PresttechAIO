import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Download, AlertCircle, CheckCircle2, XCircle, Database, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SegmentPreset, LeadBatch } from "@shared/schema";

interface PreviewLead {
  companyName: string;
  phoneRaw: string;
  phoneNorm: string;
  cnpj: string;
  segment?: string;
  city?: string;
  state?: string;
  isDuplicate: boolean;
}

interface PreviewResult {
  totalFound: number;
  preview: PreviewLead[];
  isApiConfigured: boolean;
}

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function LeadGenerator() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    segment: "",
    cnaes: "",
    city: "",
    state: "",
    daysBack: "30"
  });
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);

  const { data: presets = [] } = useQuery<SegmentPreset[]>({
    queryKey: ["/api/segment-presets"]
  });

  const { data: batches = [] } = useQuery<LeadBatch[]>({
    queryKey: ["/api/lead-batches"]
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (filters.cnaes) params.append("cnaes", filters.cnaes);
      if (filters.city) params.append("city", filters.city);
      if (filters.state) params.append("state", filters.state);
      if (filters.daysBack) params.append("daysBack", filters.daysBack);
      if (filters.segment) params.append("segment", filters.segment);
      
      const res = await fetch(`/api/lead-generator/preview?${params.toString()}`, {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Erro ao buscar preview");
      return res.json() as Promise<PreviewResult>;
    },
    onSuccess: (data) => {
      setPreviewData(data);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao buscar empresas. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/lead-generator/run", {
        cnaes: filters.cnaes ? filters.cnaes.split(",").map(c => c.trim()) : undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        daysBack: filters.daysBack ? Number(filters.daysBack) : undefined,
        segment: filters.segment || undefined
      });
      return res.json() as Promise<LeadBatch>;
    },
    onSuccess: (batch) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Importação concluída",
        description: `${batch.totalImported} leads importados, ${batch.totalDuplicates} duplicados ignorados.`
      });
      setPreviewData(null);
    },
    onError: () => {
      toast({
        title: "Erro na importação",
        description: "Falha ao importar leads. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === Number(presetId));
    if (preset) {
      setFilters(prev => ({
        ...prev,
        segment: preset.segment,
        cnaes: preset.cnaes?.join(", ") || ""
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
          Gerador de Leads
        </h1>
        <p className="text-slate-600">
          Busque empresas na base Casa dos Dados e importe como novos leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros de Busca
            </CardTitle>
            <CardDescription>
              Configure os filtros para encontrar empresas relevantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preset de Segmento</Label>
                <Select onValueChange={handlePresetSelect}>
                  <SelectTrigger data-testid="select-preset">
                    <SelectValue placeholder="Selecione um preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.filter(p => p.isActive).map(preset => (
                      <SelectItem key={preset.id} value={String(preset.id)}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Segmento (tag do lead)</Label>
                <Input
                  value={filters.segment}
                  onChange={(e) => setFilters(prev => ({ ...prev, segment: e.target.value }))}
                  placeholder="Ex: PADARIA"
                  data-testid="input-segment"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CNAEs (separados por vírgula)</Label>
              <Input
                value={filters.cnaes}
                onChange={(e) => setFilters(prev => ({ ...prev, cnaes: e.target.value }))}
                placeholder="Ex: 4721102, 4711301"
                data-testid="input-cnaes"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={filters.city}
                  onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ex: São Paulo"
                  data-testid="input-city"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={filters.state} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, state: v }))}
                >
                  <SelectTrigger data-testid="select-state">
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Abertas nos últimos (dias)</Label>
                <Input
                  type="number"
                  value={filters.daysBack}
                  onChange={(e) => setFilters(prev => ({ ...prev, daysBack: e.target.value }))}
                  placeholder="30"
                  data-testid="input-days-back"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => previewMutation.mutate()}
                disabled={previewMutation.isPending}
                data-testid="button-preview"
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Visualizar Preview
              </Button>

              {previewData && previewData.preview.length > 0 && (
                <Button 
                  variant="default"
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending}
                  data-testid="button-run-import"
                >
                  {runMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Importar Leads
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Últimas Importações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {batches.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma importação realizada.</p>
            ) : (
              <div className="space-y-3">
                {batches.slice(0, 5).map(batch => (
                  <div key={batch.id} className="p-3 border rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Batch #{batch.id}</span>
                      <Badge 
                        variant={batch.status === "CONCLUIDO" ? "default" : batch.status === "ERRO" ? "destructive" : "secondary"}
                        size="sm"
                      >
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="text-slate-600 space-y-0.5">
                      <p>Importados: {batch.totalImported}</p>
                      <p>Duplicados: {batch.totalDuplicates}</p>
                      {batch.totalErrors > 0 && <p>Erros: {batch.totalErrors}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Resultado do Preview
              </div>
              <div className="flex items-center gap-4 text-sm font-normal">
                <span>Total encontrado: <strong>{previewData.totalFound}</strong></span>
                {!previewData.isApiConfigured && (
                  <Badge variant="outline" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Dados simulados
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.preview.map((lead, idx) => (
                  <TableRow key={idx} data-testid={`row-preview-${idx}`}>
                    <TableCell className="font-medium">{lead.companyName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {lead.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                    </TableCell>
                    <TableCell>{lead.phoneRaw}</TableCell>
                    <TableCell>{lead.city}/{lead.state}</TableCell>
                    <TableCell>
                      {lead.isDuplicate ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Duplicado
                        </Badge>
                      ) : (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Novo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

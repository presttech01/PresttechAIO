import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import type { Rule } from "@shared/schema";

const RULE_TYPES = [
  { value: "PROIBIDA", label: "Proibida", color: "destructive" as const },
  { value: "PERMITIDA", label: "Permitida", color: "default" as const },
] as const;

const ruleFormSchema = z.object({
  type: z.enum(["PROIBIDA", "PERMITIDA"], {
    required_error: "Tipo é obrigatório",
  }),
  term: z.string().min(1, "Termo é obrigatório"),
  message: z.string().optional(),
  isActive: z.boolean().default(true),
});

type RuleFormData = z.infer<typeof ruleFormSchema>;

export default function Rules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isHead = user?.role === "HEAD";

  const { data: rules, isLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const res = await apiRequest("POST", "/api/rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Sucesso", description: "Regra criada com sucesso" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar regra", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RuleFormData> }) => {
      const res = await apiRequest("PUT", `/api/rules/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Sucesso", description: "Regra atualizada com sucesso" });
      setIsDialogOpen(false);
      setEditingRule(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar regra", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Sucesso", description: "Regra excluída com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao excluir regra", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/rules/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({ title: "Sucesso", description: "Status da regra atualizado" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
    },
  });

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const prohibitedRules = rules?.filter(r => r.type === "PROIBIDA") || [];
  const allowedRules = rules?.filter(r => r.type === "PERMITIDA") || [];

  if (isLoading) {
    return <div className="p-8" data-testid="loading-rules">Carregando regras...</div>;
  }

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader 
        title="Controle de Promessas" 
        description="Gerencie os termos proibidos e permitidos durante as negociações."
      >
        {isHead && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-rule">
                <Plus className="mr-2 h-4 w-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Editar Regra" : "Criar Nova Regra"}
                </DialogTitle>
              </DialogHeader>
              <RuleForm
                initialData={editingRule}
                onSubmit={(data) => {
                  if (editingRule) {
                    updateMutation.mutate({ id: editingRule.id, data });
                  } else {
                    createMutation.mutate(data);
                  }
                }}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
                onCancel={handleCloseDialog}
              />
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      {(!rules || rules.length === 0) ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-rules">
              Nenhuma regra encontrada.
            </p>
            {isHead && (
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Nova Regra" para criar a primeira.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4" data-testid="section-rules-proibida">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="text-lg font-semibold text-slate-900">Termos Proibidos</h2>
              <Badge variant="destructive" className="ml-2">
                {prohibitedRules.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Estes termos disparam alertas quando usados nas negociações.
            </p>
            
            {prohibitedRules.length === 0 ? (
              <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground" data-testid="text-no-prohibited-rules">
                    Nenhum termo proibido cadastrado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {prohibitedRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isHead={isHead}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onToggleActive={(id, isActive) => toggleActiveMutation.mutate({ id, isActive })}
                    isToggling={toggleActiveMutation.isPending}
                    colorClass="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4" data-testid="section-rules-permitida">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-slate-900">Termos Permitidos</h2>
              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {allowedRules.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Estes termos são liberados para uso nas negociações.
            </p>
            
            {allowedRules.length === 0 ? (
              <Card className="border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground" data-testid="text-no-allowed-rules">
                    Nenhum termo permitido cadastrado.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {allowedRules.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isHead={isHead}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onToggleActive={(id, isActive) => toggleActiveMutation.mutate({ id, isActive })}
                    isToggling={toggleActiveMutation.isPending}
                    colorClass="border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RuleCardProps {
  rule: Rule;
  isHead: boolean;
  onEdit: (rule: Rule) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  isToggling: boolean;
  colorClass: string;
}

function RuleCard({ rule, isHead, onEdit, onDelete, onToggleActive, isToggling, colorClass }: RuleCardProps) {
  return (
    <Card 
      className={`shadow-sm ${colorClass} ${!rule.isActive ? 'opacity-60' : ''}`}
      data-testid={`card-rule-${rule.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className="font-semibold text-slate-900"
                data-testid={`text-rule-term-${rule.id}`}
              >
                {rule.term}
              </span>
              {!rule.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inativa
                </Badge>
              )}
            </div>
            {rule.message && (
              <div className="flex items-start gap-2 mt-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p 
                  className="text-sm text-muted-foreground"
                  data-testid={`text-rule-message-${rule.id}`}
                >
                  {rule.message}
                </p>
              </div>
            )}
          </div>
          
          {isHead && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch
                checked={rule.isActive}
                onCheckedChange={(checked) => onToggleActive(rule.id, checked)}
                disabled={isToggling}
                data-testid={`switch-rule-active-${rule.id}`}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(rule)}
                data-testid={`button-edit-rule-${rule.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`button-delete-rule-${rule.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Regra</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a regra "{rule.term}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid={`button-cancel-delete-${rule.id}`}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(rule.id)}
                      className="bg-destructive text-destructive-foreground"
                      data-testid={`button-confirm-delete-${rule.id}`}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RuleFormProps {
  initialData: Rule | null;
  onSubmit: (data: RuleFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

function RuleForm({ initialData, onSubmit, isSubmitting, onCancel }: RuleFormProps) {
  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      type: initialData?.type || undefined,
      term: initialData?.term || "",
      message: initialData?.message || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo da Regra</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-rule-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem 
                    value="PROIBIDA" 
                    data-testid="option-type-proibida"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      Proibida
                    </span>
                  </SelectItem>
                  <SelectItem 
                    value="PERMITIDA"
                    data-testid="option-type-permitida"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      Permitida
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Termo</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: desconto, prazo estendido" 
                  {...field} 
                  data-testid="input-rule-term"
                />
              </FormControl>
              <FormDescription>
                Palavra ou frase que será detectada nas comunicações.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem de Alerta (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Não oferecer descontos sem aprovação"
                  {...field}
                  data-testid="input-rule-message"
                />
              </FormControl>
              <FormDescription>
                Mensagem exibida quando o termo for detectado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Regra Ativa</FormLabel>
                <FormDescription>
                  Regras inativas não disparam alertas.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="switch-rule-form-active"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-rule"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="button-submit-rule"
          >
            {isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Regra")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

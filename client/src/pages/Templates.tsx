import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Plus, Copy, Pencil, Trash2, FileText } from "lucide-react";
import type { MessageTemplate } from "@shared/schema";

const CATEGORIES = [
  { value: "FOLLOWUP", label: "Follow-up" },
  { value: "MATERIAIS", label: "Materiais" },
  { value: "PROPOSTA", label: "Proposta" },
  { value: "RECESSO", label: "Recesso" },
  { value: "AGENDAMENTO", label: "Agendamento" },
  { value: "POSVENDA", label: "Pós-venda" },
  { value: "ENTREGA", label: "Entrega" },
] as const;

const templateFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.enum(["FOLLOWUP", "MATERIAIS", "PROPOSTA", "RECESSO", "AGENDAMENTO", "POSVENDA", "ENTREGA"], {
    required_error: "Categoria é obrigatória",
  }),
  text: z.string().min(1, "Texto do template é obrigatório"),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export default function Templates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isHead = user?.role === "HEAD";

  const { data: templates, isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const res = await apiRequest("POST", "/api/message-templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({ title: "Sucesso", description: "Template criado com sucesso" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar template", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TemplateFormData> }) => {
      const res = await apiRequest("PUT", `/api/message-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({ title: "Sucesso", description: "Template atualizado com sucesso" });
      setIsDialogOpen(false);
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar template", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/message-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      toast({ title: "Sucesso", description: "Template excluído com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao excluir template", variant: "destructive" });
    },
  });

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
    } catch {
      toast({ title: "Erro", description: "Falha ao copiar texto", variant: "destructive" });
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const groupedTemplates = templates?.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, MessageTemplate[]>) || {};

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  if (isLoading) {
    return <div className="p-8" data-testid="loading-templates">Carregando templates...</div>;
  }

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader 
        title="Templates de Mensagens" 
        description="Gerencie os templates de mensagens para comunicação com clientes."
      >
        {isHead && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-template">
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Editar Template" : "Criar Novo Template"}
                </DialogTitle>
              </DialogHeader>
              <TemplateForm
                initialData={editingTemplate}
                onSubmit={(data) => {
                  if (editingTemplate) {
                    updateMutation.mutate({ id: editingTemplate.id, data });
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

      {Object.keys(groupedTemplates).length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-templates">
              Nenhum template encontrado.
            </p>
            {isHead && (
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Novo Template" para criar o primeiro.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        CATEGORIES.map((category) => {
          const categoryTemplates = groupedTemplates[category.value];
          if (!categoryTemplates || categoryTemplates.length === 0) return null;

          return (
            <div key={category.value} className="space-y-4" data-testid={`section-category-${category.value.toLowerCase()}`}>
              <h2 className="text-lg font-semibold text-slate-900">{category.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="border-border/50 shadow-sm"
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <span className="truncate" data-testid={`text-template-name-${template.id}`}>
                          {template.name}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyText(template.text)}
                            data-testid={`button-copy-template-${template.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {isHead && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(template)}
                                data-testid={`button-edit-template-${template.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    data-testid={`button-delete-template-${template.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o template "{template.name}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel data-testid={`button-cancel-delete-${template.id}`}>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(template.id)}
                                      className="bg-destructive text-destructive-foreground"
                                      data-testid={`button-confirm-delete-${template.id}`}
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap"
                        data-testid={`text-template-content-${template.id}`}
                      >
                        {template.text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

interface TemplateFormProps {
  initialData: MessageTemplate | null;
  onSubmit: (data: TemplateFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

function TemplateForm({ initialData, onSubmit, isSubmitting, onCancel }: TemplateFormProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || undefined,
      text: initialData?.text || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Template</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Follow-up após proposta" 
                  {...field} 
                  data-testid="input-template-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-template-category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category.value} 
                      value={category.value}
                      data-testid={`option-category-${category.value.toLowerCase()}`}
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto do Template</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Digite o texto do template aqui..."
                  className="min-h-[150px] resize-none"
                  {...field}
                  data-testid="textarea-template-text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            data-testid="button-cancel-template"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            data-testid="button-submit-template"
          >
            {isSubmitting ? "Salvando..." : (initialData ? "Salvar Alterações" : "Criar Template")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

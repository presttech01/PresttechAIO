import { useParams, Link, useLocation } from "wouter";
import { useLead } from "@/hooks/use-leads";
import { useDiagnosis, useCreateDiagnosis, useCreateDeal } from "@/hooks/use-interactions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiagnosisSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Separator } from "@/components/ui/separator";
import { Check, ArrowLeft, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Preços padrão dos pacotes
const PACKAGE_PRICES = {
  STARTER: 99700,   // R$ 997,00
  BUSINESS: 249700, // R$ 2.497,00  
  TECHPRO: 499700   // R$ 4.997,00
};

export default function Diagnosis() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const leadId = Number(id);
  const { data: lead } = useLead(leadId);
  const { data: previousDiagnosis } = useDiagnosis(leadId);
  const createDiagnosis = useCreateDiagnosis();
  const createDeal = useCreateDeal();
  const { toast } = useToast();
  const [score, setScore] = useState(0);

  const form = useForm({
    resolver: zodResolver(insertDiagnosisSchema),
    defaultValues: {
      leadId,
      userId: 1, // Mock
      hasSite: false,
      hasGoogle: false,
      hasWhatsapp: false,
      hasDomain: false,
      hasLogo: false,
      objective: "",
      urgency: 1,
      notes: "",
      recommendedPackage: "STARTER" as const
    }
  });

  const values = form.watch();

  // Calculate score in real-time
  useEffect(() => {
    let s = 0;
    if (values.hasSite) s += 2;
    if (values.hasGoogle) s += 2;
    if (values.hasWhatsapp) s += 2;
    if (values.hasDomain) s += 2;
    if (values.hasLogo) s += 2;
    setScore(s);
  }, [JSON.stringify(values)]);

  function onSubmit(data: any) {
    // Calcular pacote recomendado baseado no score
    const pkg = score < 4 ? "STARTER" : score < 8 ? "BUSINESS" : "TECHPRO";
    
    createDiagnosis.mutate(data, {
      onSuccess: () => {
        toast({ 
          title: "Diagnóstico Salvo", 
          description: "Criando negócio automaticamente..." 
        });
        
        // Criar Deal automaticamente com pacote recomendado
        createDeal.mutate({
          leadId,
          packageSold: pkg as "STARTER" | "BUSINESS" | "TECHPRO",
          value: PACKAGE_PRICES[pkg as keyof typeof PACKAGE_PRICES],
          status: "EM_NEGOCIACAO"
        }, {
          onSuccess: () => {
            toast({ 
              title: "Negócio Criado!", 
              description: `Pacote ${pkg} - Redirecionando para Negócios...` 
            });
            setLocation('/deals');
          },
          onError: () => {
            toast({ 
              title: "Erro", 
              description: "Falha ao criar negócio", 
              variant: "destructive" 
            });
          }
        });
      },
      onError: () => {
        toast({ 
          title: "Erro", 
          description: "Falha ao salvar diagnóstico", 
          variant: "destructive" 
        });
      }
    });
  }

  if (!lead) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-enter">
      <div className="mb-6">
        <Link href={`/leads/${leadId}/call`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar para Ligação
        </Link>
        <PageHeader title={`Diagnóstico: ${lead.companyName}`} description="Avalie a maturidade digital para recomendar o pacote certo." />
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Checklist de Presença Digital</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {['hasSite', 'hasGoogle', 'hasWhatsapp', 'hasDomain', 'hasLogo'].map((field) => (
                    <FormField
                      key={field}
                      control={form.control}
                      name={field as any}
                      render={({ field: { value, onChange, ...f } }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base capitalize">
                              {field.replace('has', 'Possui ')}
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={value} onCheckedChange={onChange} {...f} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="objective"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo do Cliente</FormLabel>
                        <FormControl>
                          <Textarea placeholder="O que estão tentando alcançar?" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Anotações Adicionais</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Restrições de orçamento, tomadores de decisão, etc." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={createDiagnosis.isPending}>
                {createDiagnosis.isPending ? "Salvando..." : "Salvar Diagnóstico"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/25">
            <CardHeader>
              <CardTitle className="opacity-90">Pontuação de Maturidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold font-display">{score}/10</div>
              <p className="mt-2 opacity-80 text-sm">Baseado nos itens do checklist</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Recomendado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-2">
                {score < 4 ? "STARTER" : score < 8 ? "BUSINESS" : "TECHPRO"}
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado no score de maturidade, este pacote oferece o melhor valor para seu estágio atual.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center gap-2">
                <Send className="h-4 w-4" /> Pitch WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-green-700 bg-white p-3 rounded border border-green-100 font-mono">
                "Olá {lead.companyName}, conforme conversamos, sua pontuação de maturidade digital foi {score}/10. O pacote ideal para vocês é o {score < 4 ? "Starter" : score < 8 ? "Business" : "TechPro"}..."
              </p>
              <Button size="sm" variant="outline" className="w-full mt-3 border-green-200 text-green-700 hover:bg-green-100">
                Copiar para Área de Transferência
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

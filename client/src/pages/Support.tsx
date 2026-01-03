import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupportTickets, useCreateTicket } from "@/hooks/use-interactions";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupportTicketSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Support() {
  const { data: tickets, isLoading } = useSupportTickets();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader title="Tickets de Suporte" description="Gerencie solicitações e problemas de clientes.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Novo Ticket
            </Button>
          </DialogTrigger>
          <CreateTicketDialog onSuccess={() => setOpen(false)} />
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tickets?.map((ticket) => (
          <Card key={ticket.id} className="border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                #{ticket.id} • {ticket.category}
              </CardTitle>
              <StatusBadge status={ticket.status || "ABERTO"} />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold mb-2">ID Lead: {ticket.leadId}</div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {ticket.description}
              </p>
              <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                <span>Aberto em {new Date(ticket.createdAt!).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateTicketDialog({ onSuccess }: { onSuccess: () => void }) {
  const createTicket = useCreateTicket();
  const form = useForm({
    resolver: zodResolver(insertSupportTicketSchema),
    defaultValues: {
      leadId: 0,
      userId: 1,
      category: "DUVIDA",
      description: "",
      status: "ABERTO"
    }
  });

  function onSubmit(data: any) {
    createTicket.mutate(data, { onSuccess });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Criar Ticket de Suporte</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="leadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Lead</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                </FormControl>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DUVIDA">Dúvida</SelectItem>
                    <SelectItem value="BUG">Bug</SelectItem>
                    <SelectItem value="AJUSTE_TEXTO">Ajuste de Texto</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={createTicket.isPending}>
            {createTicket.isPending ? "Criando..." : "Criar Ticket"}
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
}

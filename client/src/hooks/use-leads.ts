import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useLeads(filters?: { status?: string; search?: string; userId?: number }) {
  const queryKey = [api.leads.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.leads.list.path, window.location.origin);
      if (filters?.status) url.searchParams.append("status", filters.status);
      if (filters?.search) url.searchParams.append("search", filters.search);
      if (filters?.userId) url.searchParams.append("userId", String(filters.userId));
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch leads");
      return api.leads.list.responses[200].parse(await res.json());
    },
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: [api.leads.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.leads.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch lead");
      return api.leads.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.leads.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create lead");
      return api.leads.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      toast({ title: "Sucesso", description: "Lead criado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar lead", variant: "destructive" });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const url = buildUrl(api.leads.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return api.leads.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.leads.get.path, data.id] });
      toast({ title: "Sucesso", description: "Lead atualizado" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar lead", variant: "destructive" });
    },
  });
}

export function useNextLead() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.leads.next.path);
      if (!res.ok) throw new Error("Failed to get next lead");
      const data = await res.json();
      return data ? api.leads.next.responses[200].parse(data) : null;
    },
    onSuccess: (lead) => {
      if (lead) {
        setLocation(`/leads/${lead.id}/call`);
      } else {
        toast({ title: "Tudo em dia!", description: "Nenhum lead novo disponível no momento." });
      }
    },
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await fetch(api.leads.import.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to import leads");
      return api.leads.import.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      toast({ 
        title: "Importação Concluída", 
        description: `${data.imported} leads importados. ${data.duplicates} duplicados ignorados.` 
      });
    },
  });
}

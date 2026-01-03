import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// === CALL LOGS ===
export function useCallLogs(leadId: number) {
  return useQuery({
    queryKey: [api.calls.list.path, leadId],
    queryFn: async () => {
      const url = buildUrl(api.calls.list.path, { id: leadId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch call logs");
      return api.calls.list.responses[200].parse(await res.json());
    },
    enabled: !!leadId,
  });
}

export function useCreateCallLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.calls.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log call");
      return api.calls.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.calls.list.path, data.leadId] });
      queryClient.invalidateQueries({ queryKey: [api.leads.get.path, data.leadId] });
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
    },
  });
}

// === DIAGNOSIS ===
export function useDiagnosis(leadId: number) {
  return useQuery({
    queryKey: [api.diagnosis.get.path, leadId],
    queryFn: async () => {
      const url = buildUrl(api.diagnosis.get.path, { id: leadId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch diagnosis");
      return api.diagnosis.get.responses[200].parse(await res.json());
    },
    enabled: !!leadId,
  });
}

export function useCreateDiagnosis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.diagnosis.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save diagnosis");
      return api.diagnosis.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.diagnosis.get.path, data.leadId] });
      toast({ title: "Salvo", description: "Diagnóstico salvo com sucesso" });
    },
  });
}

// === DEALS ===
export function useDeals() {
  return useQuery({
    queryKey: [api.deals.list.path],
    queryFn: async () => {
      const res = await fetch(api.deals.list.path);
      if (!res.ok) throw new Error("Failed to fetch deals");
      return api.deals.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.deals.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create deal");
      return api.deals.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.deals.list.path] });
      toast({ title: "Sucesso", description: "Negócio criado!" });
    },
  });
}

// === HANDOFFS ===
export function useCreateHandoff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.handoffs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create handoff");
      return api.handoffs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Sucesso", description: "Projeto entregue para produção" });
    },
  });
}

// === PRODUCTION ===
export function useProductionTasks() {
  return useQuery({
    queryKey: [api.production.list.path],
    queryFn: async () => {
      const res = await fetch(api.production.list.path);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.production.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateProductionTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & any) => {
      const url = buildUrl(api.production.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return api.production.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.production.list.path] });
    },
  });
}

// === SUPPORT ===
export function useSupportTickets() {
  return useQuery({
    queryKey: [api.support.list.path],
    queryFn: async () => {
      const res = await fetch(api.support.list.path);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return api.support.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.support.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      return api.support.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.support.list.path] });
      toast({ title: "Ticket Criado", description: "Equipe de suporte notificada." });
    },
  });
}

// === STATS ===
export function useStats() {
  return useQuery({
    queryKey: [api.dashboard.stats.path],
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.dashboard.stats.responses[200].parse(await res.json());
    },
  });
}

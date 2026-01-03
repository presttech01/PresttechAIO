import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Deal, DealUpdate, Lead } from "@shared/schema";

export type DealWithLead = Deal & { lead: Lead };

export function useDealsWithLeads() {
  return useQuery<DealWithLead[]>({
    queryKey: ['/api/deals/with-leads'],
  });
}

export function useDealUpdates(dealId: number) {
  return useQuery<DealUpdate[]>({
    queryKey: ['/api/deals', dealId, 'updates'],
    enabled: !!dealId,
  });
}

export function useUpdateDeal() {
  return useMutation({
    mutationFn: async ({ dealId, data }: { dealId: number; data: { status?: string; value?: number; lossReason?: string } }) => {
      const response = await apiRequest('PATCH', `/api/deals/${dealId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals/with-leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
    }
  });
}

export function useAddDealUpdate() {
  return useMutation({
    mutationFn: async ({ dealId, type, note }: { dealId: number; type: string; note: string }) => {
      const response = await apiRequest('POST', `/api/deals/${dealId}/updates`, { type, note });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', variables.dealId, 'updates'] });
    }
  });
}

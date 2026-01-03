import { useQuery } from "@tanstack/react-query";

export function useMyStats() {
  return useQuery<{ leads: number; calls: number; sales: number; revenue: number }>({
    queryKey: ['/api/stats/me'],
  });
}

export function useSDRRankings() {
  return useQuery<Array<{ userId: number; userName: string; leads: number; calls: number; sales: number; revenue: number; conversionRate: number }>>({
    queryKey: ['/api/stats/rankings'],
  });
}

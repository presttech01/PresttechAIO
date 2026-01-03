import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Users, Phone, Loader2 } from "lucide-react";

export default function Reports() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: leads } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weeklyData = [
    { name: 'Seg', ligacoes: 45, vendas: 2 },
    { name: 'Ter', ligacoes: 52, vendas: 3 },
    { name: 'Qua', ligacoes: 38, vendas: 1 },
    { name: 'Qui', ligacoes: 61, vendas: 4 },
    { name: 'Sex', ligacoes: 55, vendas: 3 },
  ];

  const statusCounts = leads?.reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const statusLabels: Record<string, string> = {
    NOVO: "Novos",
    TENTATIVA: "Tentativas",
    CONTATO_REALIZADO: "Contato Realizado",
    DIAGNOSTICO_AGENDADO: "Diagnóstico Agendado",
    PROPOSTA_ENVIADA: "Proposta Enviada",
    VENDIDO: "Vendidos",
    PERDIDO: "Perdidos",
    OPTOUT: "Opt-out",
    NUMERO_INVALIDO: "Número Inválido",
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];

  const pieData = Object.entries(statusCounts).map(([status, count], index) => ({
    name: statusLabels[status] || status,
    value: count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader 
        title="Relatórios" 
        description="Visualize o desempenho da equipe e métricas de vendas."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Leads</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-total-leads">
                  {leads?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ligações</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-total-calls">
                  {(stats as any)?.calls || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                <Phone className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendas</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-total-sales">
                  {(stats as any)?.sales || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <h3 className="text-2xl font-bold mt-1" data-testid="text-conversion-rate">
                  {(stats as any)?.conversionRate || 0}%
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Atividade Semanal</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="ligacoes" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Ligações" />
                <Bar dataKey="vendas" fill="#10B981" radius={[4, 4, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Distribuição de Leads por Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum lead para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

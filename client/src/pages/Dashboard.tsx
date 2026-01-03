import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyStats, useSDRRankings } from "@/hooks/use-stats";
import { PhoneCall, DollarSign, Users, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: myStats, isLoading: isLoadingMyStats } = useMyStats();
  const { data: rankings, isLoading: isLoadingRankings } = useSDRRankings();

  if (isLoadingMyStats) {
    return <div className="p-8">Carregando painel...</div>;
  }

  const chartData = [
    { name: 'Seg', calls: 40, sales: 2 },
    { name: 'Ter', calls: 30, sales: 1 },
    { name: 'Qua', calls: 50, sales: 3 },
    { name: 'Qui', calls: 45, sales: 2 },
    { name: 'Sex', calls: 60, sales: 5 },
  ];

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  }

  return (
    <div className="space-y-8 animate-enter">
      <PageHeader title="Painel de Controle" description="Visao geral do seu desempenho." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Ligacoes Realizadas" 
          value={myStats?.calls || 0} 
          icon={PhoneCall} 
          trend="Suas ligacoes registradas"
          color="text-blue-600"
          bg="bg-blue-50"
          testId="stats-calls"
        />
        <StatsCard 
          title="Leads Atribuidos" 
          value={myStats?.leads || 0} 
          icon={Users} 
          trend="Leads sob sua responsabilidade"
          color="text-indigo-600"
          bg="bg-indigo-50"
          testId="stats-leads"
        />
        <StatsCard 
          title="Vendas Fechadas" 
          value={myStats?.sales || 0} 
          icon={Trophy} 
          trend="Negocios fechados por voce"
          color="text-green-600"
          bg="bg-green-50"
          testId="stats-sales"
        />
        <StatsCard 
          title="Receita Gerada" 
          value={formatCurrency(myStats?.revenue || 0)} 
          icon={DollarSign} 
          trend="Total em negocios fechados"
          color="text-amber-600"
          bg="bg-amber-50"
          testId="stats-revenue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Visao Geral de Atividades</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="calls" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Ligacoes" />
                <Bar dataKey="sales" fill="#10B981" radius={[4, 4, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Melhores Desempenhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingRankings ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                ))
              ) : rankings && rankings.length > 0 ? (
                rankings.slice(0, 5).map((sdr, index) => (
                  <div 
                    key={sdr.userId} 
                    data-testid={`ranking-sdr-${sdr.userId}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium" data-testid={`ranking-name-${sdr.userId}`}>{sdr.userName}</p>
                        <p className="text-xs text-muted-foreground">{sdr.conversionRate}% conversao</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100" data-testid={`ranking-revenue-${sdr.userId}`}>
                        {formatCurrency(sdr.revenue)}
                      </p>
                      <p className="text-xs text-green-600" data-testid={`ranking-sales-${sdr.userId}`}>
                        {sdr.sales} {sdr.sales === 1 ? 'Venda' : 'Vendas'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhum SDR encontrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, color, bg, testId }: any) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{value}</h3>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bg} ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs font-medium text-muted-foreground">
          {trend}
        </div>
      </CardContent>
    </Card>
  );
}

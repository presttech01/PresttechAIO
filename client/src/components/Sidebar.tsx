import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  Briefcase, 
  LifeBuoy, 
  BarChart3, 
  LogOut,
  Factory,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Zap,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const isHead = user?.role === "HEAD";

  const navigation = [
    { name: "Painel de Controle", href: "/", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Gerador de Leads", href: "/lead-generator", icon: Zap },
    ...(isHead ? [{ name: "Duplicados", href: "/duplicates", icon: Copy }] : []),
    { name: "Negócios", href: "/deals", icon: Briefcase },
    ...(isHead ? [{ name: "Produção", href: "/production", icon: Factory }] : []),
    { name: "Suporte", href: "/support", icon: LifeBuoy },
    { name: "Templates", href: "/templates", icon: FileText },
    ...(isHead ? [{ name: "Regras", href: "/rules", icon: ShieldAlert }] : []),
    { name: "Relatórios", href: "/reports", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 text-white border-r border-slate-800">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight">Presttech Ops</span>
        </div>
        
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <span className="font-bold text-slate-300">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

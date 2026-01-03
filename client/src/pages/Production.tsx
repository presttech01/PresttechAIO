import { PageHeader } from "@/components/PageHeader";
import { useProductionTasks, useUpdateProductionTask } from "@/hooks/use-interactions";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"; // Alternative to beautiful-dnd
import { Calendar, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Group tasks by status helper
const COLUMNS = {
  AGUARDANDO_MATERIAIS: "Aguardando Materiais",
  EM_PRODUCAO: "Em Produção",
  EM_REVISAO: "Revisão",
  ENTREGUE: "Entregue"
};

export default function Production() {
  const { data: tasks, isLoading } = useProductionTasks();
  const updateTask = useUpdateProductionTask();
  
  // In a real app with dnd, we'd manage local state for optimistic updates
  // For this demo, we'll just render lists

  if (isLoading) return <div>Carregando quadro...</div>;

  return (
    <div className="h-full flex flex-col animate-enter">
      <PageHeader title="Quadro de Produção" description="Acompanhe o status da entrega de projetos." />
      
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-[1000px] pb-6">
          {Object.entries(COLUMNS).map(([status, title]) => {
            const columnTasks = tasks?.filter(t => t.status === status) || [];
            
            return (
              <div key={status} className="flex-1 min-w-[300px] flex flex-col bg-slate-50 rounded-xl border border-slate-200/60 p-4">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-semibold text-slate-700">{title}</h3>
                  <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {columnTasks.length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {columnTasks.map(task => (
                    <Card key={task.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                            {task.lead.companyName}
                          </h4>
                          {task.priority === 'ALTA' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.priority || 'MEDIA'} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { TaskStatusColumn } from '@/lib/task-constants'
import type { ReactNode } from 'react'

interface TaskBoardColumnProps<TTask extends { id: string }> {
  column: TaskStatusColumn
  tasks: TTask[]
  renderTask: (task: TTask) => ReactNode
  emptyClassName?: string
}

export function TaskBoardColumn<TTask extends { id: string }>({
  column,
  tasks,
  renderTask,
  emptyClassName,
}: TaskBoardColumnProps<TTask>) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const IconComponent = column.icon

  return (
    <div className="w-full min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className={`flex items-center justify-between mb-3 px-3 py-2.5 rounded-t-lg border-b-2 ${column.headerColor} shadow-sm`}>
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-gray-900 text-sm">{column.title}</h3>
        </div>
        <Badge className={`${column.color} text-xs font-medium px-2 py-0.5 shadow-sm`}>
          {tasks.length > 999 ? '999+' : tasks.length}
        </Badge>
      </div>

      <SortableContext
        items={tasks.map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`space-y-2.5 min-h-[400px] max-h-[calc(100vh-280px)] overflow-y-auto p-3 rounded-b-lg bg-gray-50/50 transition-all duration-200 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
            isOver
              ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50/80 shadow-lg'
              : 'border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {tasks.map(renderTask)}
          {tasks.length === 0 && (
            <div className={`flex flex-col items-center justify-center py-12 text-gray-400 ${emptyClassName ?? ''}`}>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500">No tasks</p>
              <p className="text-xs text-gray-400 mt-1">Drop tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

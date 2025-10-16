import React from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '../../utils/helpers';
import { 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  File, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { PriorityBadge } from './Badge';
import { CategoryBadge } from './Badge';
import FileAttachment from './FileAttachment';
import { TODO_COLOR_CLASSES } from '../../utils/colors';
import { isOverdue, formatRelativeTime } from '../../utils/helpers';

const TodoListItem = ({
  todo,
  selectedTodos,
  deletingFiles,
  onSelectTodo,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewTodo,
  onFileDelete,
  getDueDateInfo,
  getStatusBadgeInfo,
  getActionTimeInfo
}) => {
  const dueDateInfo = getDueDateInfo(todo.due_date);
  
  return (
    <Card 
      key={todo.id} 
      className={cn(
        "hover:shadow-lg transition-all duration-200 group cursor-pointer border-0",
        selectedTodos.includes(todo.id) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10",
        // Overdue styling (highest priority) - left border only
        isOverdue(todo.due_date) && `border-l-4 ${TODO_COLOR_CLASSES.OVERDUE_BORDER} ${TODO_COLOR_CLASSES.OVERDUE_BG}`,
        // Status-based styling (only if not overdue) - left border only
        !isOverdue(todo.due_date) && todo.status === 'completed' && `border-l-4 ${TODO_COLOR_CLASSES.COMPLETED_BORDER} ${TODO_COLOR_CLASSES.COMPLETED_BG}`,
        !isOverdue(todo.due_date) && todo.status === 'in_progress' && `border-l-4 ${TODO_COLOR_CLASSES.IN_PROGRESS_BORDER} ${TODO_COLOR_CLASSES.IN_PROGRESS_BG}`,
        !isOverdue(todo.due_date) && todo.status === 'pending' && `border-l-4 ${TODO_COLOR_CLASSES.TODO_BORDER} ${TODO_COLOR_CLASSES.TODO_BG}`
      )} 
      onClick={() => onViewTodo(todo)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Bulk selection checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectTodo(todo.id);
              }}
              disabled={todo.status === 'completed'}
              className={cn(
                "mt-1 p-1 rounded transition-colors",
                todo.status === 'completed'
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              title={
                todo.status === 'completed'
                  ? "Cannot select completed todos"
                  : "Select for bulk actions"
              }
            >
              {selectedTodos.includes(todo.id) ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className={cn(
                  "w-5 h-5",
                  todo.status === 'completed'
                    ? "text-gray-300"
                    : "text-gray-400"
                )} />
              )}
            </button>
            
            {/* Todo completion toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (todo.status !== 'completed') onToggleComplete(todo.id);
              }}
              disabled={todo.status === 'completed'}
              className={cn(
                "mt-1 icon-button transition-all duration-200",
                todo.status === 'completed' 
                  ? "cursor-not-allowed opacity-60" 
                  : "hover:scale-110"
              )}
              title={todo.status === 'completed' ? "Cannot unmark completed to do" : "Mark as complete"}
            >
              {todo.status === 'completed' ? (
                <CheckCircle2 className="icon-modern-md text-success-600" />
              ) : (
                <Circle className="icon-modern-md text-muted-foreground hover:text-foreground" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={cn(
                  "text-lg font-medium",
                  todo.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {todo.title}
                </h3>
                <PriorityBadge priority={todo.priority} size="sm" />
                <Badge 
                  variant="outline" 
                  size="sm"
                  className={getStatusBadgeInfo(todo.status).className}
                >
                  {getStatusBadgeInfo(todo.status).label}
                </Badge>
                {todo.category && (
                  <CategoryBadge category={todo.category} size="sm" />
                )}
              </div>
              
              {todo.description && (
                <div 
                  className="text-muted-foreground text-sm mb-3 line-clamp-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: todo.description }}
                />
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {todo.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className={dueDateInfo.className}>
                      {dueDateInfo.text}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {getActionTimeInfo(todo).label} {formatRelativeTime(getActionTimeInfo(todo).time)}
                  </span>
                </div>
                
                {todo.file_count > 0 && (
                  <div className="flex items-center gap-1">
                    <File className="h-4 w-4" />
                    <span>
                      {todo.file_count} file{todo.file_count > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              
              {/* File Attachments Preview */}
              {todo.attachments && todo.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Attachments:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {todo.attachments.slice(0, 3).map((attachment) => (
                      <FileAttachment
                        key={attachment.id}
                        attachment={attachment}
                        onDelete={onFileDelete}
                        size="small"
                        showActions={true}
                        isDeleting={deletingFiles.has(attachment.id)}
                      />
                    ))}
                    {todo.attachments.length > 3 && (
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                        +{todo.attachments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(todo);
              }}
            >
              <Edit className="icon-modern-sm" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="icon-modern-sm" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodoListItem;

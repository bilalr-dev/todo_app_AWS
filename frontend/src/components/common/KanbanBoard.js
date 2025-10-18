import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityBadge, CategoryBadge } from './Badge';
import { 
  Edit, 
  Trash2, 
  File,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn, formatDate, isToday, isTomorrow, isOverdue } from '../../utils/helpers';
import { TODO_COLOR_CLASSES, getDueDateBadgeClass } from '../../utils/colors';



// Helper function to get due date info (same as Dashboard)
const getDueDateInfo = (dueDate) => {
  if (!dueDate) return { text: 'No due date', className: 'text-muted-foreground' };
  
  if (isOverdue(dueDate)) {
    return { text: 'Overdue', className: 'text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md' };
  }
  
  if (isToday(dueDate)) {
    return { text: 'Due today', className: 'text-orange-600 font-medium' };
  }
  
  if (isTomorrow(dueDate)) {
    return { text: 'Due tomorrow', className: 'text-blue-600 font-medium' };
  }
  
  return { text: formatDate(dueDate), className: 'text-muted-foreground' };
};

// Sortable Todo Item Component
const SortableTodoItem = ({ todo, onEdit, onDelete, onToggleComplete, onFileClick, onViewTodo, selectedTodos = [], onSelectTodo }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };


  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(todo);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(todo);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg cursor-pointer overflow-hidden",
        isDragging && "opacity-50 shadow-xl scale-105 rotate-1 cursor-move",
        // Overdue styling (highest priority) - left border only
        isOverdue(todo.due_date) && `border-l-4 ${TODO_COLOR_CLASSES.OVERDUE_BORDER}`,
        // Status-based styling (only if not overdue) - left border only, no background
        !isOverdue(todo.due_date) && ((todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed') && `border-l-4 ${TODO_COLOR_CLASSES.COMPLETED_BORDER} opacity-75`,
        !isOverdue(todo.due_date) && ((todo.status || todo.state) === 'in_progress' || (todo.status || todo.state) === 'inProgress') && `border-l-4 ${TODO_COLOR_CLASSES.IN_PROGRESS_BORDER}`,
        !isOverdue(todo.due_date) && ((todo.status || todo.state) === 'pending' || (todo.status || todo.state) === 'todo') && `border-l-4 ${TODO_COLOR_CLASSES.TODO_BORDER}`,
        // Selection styling
        selectedTodos.includes(todo.id) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10"
      )}
      onClick={() => onViewTodo && onViewTodo(todo)}
    >
      {/* Drag handle */}
      <div 
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1.5 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600"
        title="Drag to move"
      >
        <svg className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
        </svg>
      </div>
      <div className="p-3 sm:p-4">
        {/* Header with title */}
        <div className="mb-2 sm:mb-3">
            <h3 className={cn(
            "text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight",
            ((todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed') && "line-through text-gray-500 dark:text-gray-50"
            )}>
              {todo.title}
            </h3>
        </div>
            
        {/* Description */}
            {todo.description && (
          <div 
            className="text-xs text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 leading-relaxed line-clamp-2 prose prose-xs max-w-none"
            dangerouslySetInnerHTML={{ __html: todo.description }}
          />
            )}


        {/* Footer with badges and metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            {/* Bulk selection checkbox */}
            {onSelectTodo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTodo(todo.id);
                }}
                disabled={(todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed'}
                className={cn(
                  "transition-colors",
                  ((todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed')
                    ? "text-gray-300 cursor-not-allowed opacity-50" 
                    : "text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
                )}
                title={((todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed') ? "Cannot select completed to dos" : "Select for bulk operations"}
              >
                {selectedTodos.includes(todo.id) ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* Badges - different layout for completed vs active todos */}
            {(todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed' ? (
              // Simplified layout for completed todos
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {todo.category && (
                  <CategoryBadge category={todo.category} size="sm" />
                )}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  Completed at: {formatDate(todo.completed_at)}
                </span>
              </div>
            ) : (
              // Full layout for active todos
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                {todo.category && (
                  <CategoryBadge category={todo.category} size="sm" />
                )}
                <PriorityBadge priority={todo.priority} size="sm" />
                {/* Status badge */}
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  (todo.status || todo.state) === 'inProgress' || (todo.status || todo.state) === 'in_progress'
                    ? TODO_COLOR_CLASSES.IN_PROGRESS_BADGE
                    : TODO_COLOR_CLASSES.TODO_BADGE
                )}>
                  {(todo.status || todo.state) === 'inProgress' || (todo.status || todo.state) === 'in_progress' ? 'In Progress' : 'To Do'}
                </span>
                {todo.due_date && (
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    getDueDateBadgeClass(todo.due_date)
                  )}>
                    {isOverdue(todo.due_date) 
                      ? "Overdue"
                      : getDueDateInfo(todo.due_date).text
                    }
                  </span>
                )}
              </div>
            )}
          </div>

          {/* File count */}
            {todo.file_count > 0 && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-50">
                <File className="w-3 h-3" />
              <span>{todo.file_count}</span>
              </div>
            )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="flex space-x-1">
          <button
            onClick={(e) => handleEdit(e)}
            className="p-1 sm:p-1.5 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all duration-200"
            title="Edit to do"
          >
            <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            onClick={(e) => handleDelete(e)}
            className="p-1 sm:p-1.5 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
            title="Delete to do"
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};

// Column Component
const KanbanColumn = ({ title, todos, onEdit, onDelete, onToggleComplete, onFileClick, onViewTodo, selectedTodos = [], onSelectTodo, color, columnId, allowDrop = true, dropMessage = null, isDragOver = false, isDragging = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: {
      type: 'column',
      columnId: columnId
    }
  });


  return (
    <div className="flex-1 min-w-0">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <div className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full", color)}></div>
          <span className="truncate">{title}</span>
          <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-50 flex-shrink-0">
            ({todos.length})
          </span>
        </h2>
      </div>
      
      <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setNodeRef}
          className={cn(
            "space-y-3 sm:space-y-4 min-h-[250px] sm:min-h-[300px] p-3 sm:p-4 border-2 border-dashed rounded-lg transition-all duration-300 relative w-full",
            // Enhanced drag feedback
            isDragging && !isDragOver && "border-gray-300 dark:border-gray-500 bg-gray-50/50 dark:bg-gray-800/50",
            // Invalid drop zone styling
            !allowDrop && (isOver || isDragOver) && "border-red-400 bg-red-50 dark:bg-red-900/10 cursor-not-allowed shadow-lg scale-[1.02]",
            // Valid drop zone styling
            allowDrop && (isOver || isDragOver) && "border-blue-400 bg-blue-50 dark:bg-blue-900/10 shadow-lg scale-[1.02]",
            // Default styling - lighter, more subtle border
            !isOver && !isDragOver && "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50/30 dark:hover:bg-gray-800/30"
          )}
        >
          {/* Drop message overlay */}
          {!allowDrop && (isOver || isDragOver) && dropMessage && (
            <div className="absolute top-2 left-2 right-2 bg-red-100 dark:bg-red-900/50 rounded-md p-2 z-10 border border-red-300 animate-pulse">
              <div className="text-red-700 dark:text-red-300 text-xs font-medium">
                ❌ {dropMessage}
              </div>
            </div>
          )}
          
          {/* Valid drop indicator */}
          {allowDrop && (isOver || isDragOver) && (
            <div className="absolute top-2 left-2 right-2 bg-blue-100 dark:bg-blue-900/50 rounded-md p-2 z-10 border border-blue-300 animate-pulse">
              <div className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                ✅ Drop to {columnId === 'complete' ? 'complete' : `move to ${title}`}
              </div>
            </div>
          )}
          
          {todos.length === 0 ? (
            <div className="flex items-center justify-center h-32 sm:h-40 w-full text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg bg-gray-50/30 dark:bg-gray-800/30 hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-colors">
              <div className="text-center p-4">
                <div className="text-base font-medium mb-2">
                  {columnId === 'complete' ? 'No completed tasks' : `No ${title.toLowerCase()} tasks`}
                </div>
                <div className="text-sm opacity-75">
                  {columnId === 'complete' ? 'Drop tasks here to mark as complete' : `Drop tasks here to move to ${title}`}
                </div>
              </div>
            </div>
          ) : (
            todos.map((todo) => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              onFileClick={onFileClick}
                onViewTodo={onViewTodo}
                selectedTodos={selectedTodos}
                onSelectTodo={onSelectTodo}
            />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// Main Kanban Board Component
const KanbanBoard = ({ 
  todos, 
  onEdit, 
  onDelete, 
  onToggleComplete, 
  onFileClick,
  onMoveTodo,
  onViewTodo,
  selectedTodos = [],
  onSelectTodo
}) => {
  const [activeId, setActiveId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Debug logging for Kanban board
  console.log('KanbanBoard: Received todos count:', todos.length);
  console.log('KanbanBoard: Todos with status field:', todos.filter(t => t.status).length);
  console.log('KanbanBoard: Todos with state field:', todos.filter(t => t.state).length);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Categorize todos into columns based on state
  // Todo: state = 'todo' (or no state field for backward compatibility)
  // In Progress: state = 'inProgress'
  // Complete: state = 'complete' (or completed = true for backward compatibility)
  
  const todoTodos = todos.filter(todo => {
    return (todo.status || todo.state) === 'pending' || (todo.status || todo.state) === 'todo';
  });
  
  const inProgressTodos = todos.filter(todo => (todo.status || todo.state) === 'inProgress' || (todo.status || todo.state) === 'in_progress');
  
  const completeTodos = todos.filter(todo => {
    return (todo.status || todo.state) === 'complete' || (todo.status || todo.state) === 'completed';
  });
  

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    // Enhanced visual feedback during drag over
    if (over) {
      const overId = over.id;
      const activeTodo = todos.find(todo => todo.id === active.id);
      
      if (activeTodo) {
        
        // Update drag over column for visual feedback
        if (overId === 'todo' || overId === 'in-progress' || overId === 'complete') {
          setDragOverColumn(overId);
        } else {
          // If dropped on another todo, determine column by the todo's current status
          const overTodo = todos.find(todo => todo.id === overId);
          if (overTodo) {
            if (overTodo.status === 'completed') {
              setDragOverColumn('complete');
            } else if (overTodo.status === 'in_progress') {
              setDragOverColumn('in-progress');
            } else {
              setDragOverColumn('todo');
            }
          }
        }
      }
    } else {
      setDragOverColumn(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    // Reset drag state
    setIsDragging(false);
    setDragOverColumn(null);
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    
    // Find the source and destination columns
    const activeTodo = todos.find(todo => todo.id === activeId);
    if (!activeTodo) {
      setActiveId(null);
      return;
    }

    // Determine target column based on overId with improved logic
    let targetColumn = 'todo';
    
    // Check if dropped on a droppable area (column)
    if (overId === 'todo' || overId === 'in-progress' || overId === 'complete') {
      targetColumn = overId;
    } else {
      // If dropped on another todo, determine column by the todo's current status
      const overTodo = todos.find(todo => todo.id === overId);
      if (overTodo) {
        const overStatus = overTodo.status || overTodo.state;
        if (overStatus === 'completed' || overStatus === 'complete') {
          targetColumn = 'complete';
        } else if (overStatus === 'in_progress' || overStatus === 'inProgress') {
          targetColumn = 'in-progress';
        } else {
          targetColumn = 'todo';
        }
      }
    }

    // Determine current column based on todo status
    let currentColumn = 'todo';
    const currentStatus = activeTodo.status || activeTodo.state;
    if (currentStatus === 'pending' || currentStatus === 'todo') {
      currentColumn = 'todo';
    } else if (currentStatus === 'in_progress' || currentStatus === 'inProgress') {
      currentColumn = 'in-progress';
    } else if (currentStatus === 'completed' || currentStatus === 'complete') {
      currentColumn = 'complete';
    } else {
      // Fallback for existing todos without status field
      currentColumn = activeTodo.completed ? 'complete' : 'todo';
    }

    // Only allow forward movement: Todo → In Progress → Complete
    // No backward movement is allowed
    const canMove = (
      (currentColumn === 'todo' && (targetColumn === 'in-progress' || targetColumn === 'complete')) ||
      (currentColumn === 'in-progress' && targetColumn === 'complete')
    );

    if (canMove && targetColumn !== currentColumn) {
      onMoveTodo(activeId, targetColumn);
    }
    
    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
    setDragOverColumn(null);
  };


  // Determine if columns should allow drops based on currently dragged item
  const getColumnAllowDrop = (columnId) => {
    if (!activeId) return true; // No active drag, allow all drops
    
    const activeTodo = todos.find(todo => todo.id === activeId);
    if (!activeTodo) return true;
    
    // Determine current column based on todo status
    let currentColumn = 'todo';
    const currentStatus = activeTodo.status || activeTodo.state;
    if (currentStatus === 'pending' || currentStatus === 'todo') {
      currentColumn = 'todo';
    } else if (currentStatus === 'in_progress' || currentStatus === 'inProgress') {
      currentColumn = 'in-progress';
    } else if (currentStatus === 'completed' || currentStatus === 'complete') {
      currentColumn = 'complete';
    } else {
      // Fallback for existing todos without status field
      currentColumn = activeTodo.completed ? 'complete' : 'todo';
    }
    
    // Only allow forward movement: Todo → In Progress → Complete
    let allowDrop = false;
    if (columnId === 'todo') {
      allowDrop = false; // Never allow drops in Todo column
    } else if (columnId === 'in-progress') {
      allowDrop = currentColumn === 'todo'; // Only allow from Todo
    } else if (columnId === 'complete') {
      allowDrop = currentColumn === 'todo' || currentColumn === 'in-progress'; // Allow from Todo or In Progress
    } else {
      allowDrop = true;
    }
    
    
    return allowDrop;
  };
  
  // Get appropriate drop message for invalid drops
  const getDropMessage = (columnId) => {
    if (!activeId) return null;
    
    const activeTodo = todos.find(todo => todo.id === activeId);
    if (!activeTodo) return null;
    
    // Determine current column based on todo status
    let currentColumn = 'todo';
    const currentStatus = activeTodo.status || activeTodo.state;
    if (currentStatus === 'pending' || currentStatus === 'todo') {
      currentColumn = 'todo';
    } else if (currentStatus === 'in_progress' || currentStatus === 'inProgress') {
      currentColumn = 'in-progress';
    } else if (currentStatus === 'completed' || currentStatus === 'complete') {
      currentColumn = 'complete';
    } else {
      currentColumn = activeTodo.completed ? 'complete' : 'todo';
    }
    
    if (columnId === 'todo') {
      return "Only forward movement is allowed";
    } else if (columnId === 'in-progress' && currentColumn !== 'todo') {
      return "Can only move from Todo";
    } else if (columnId === 'complete' && currentColumn === 'complete') {
      return "Already in Complete";
    }
    
    return null;
  };

  // Define columns configuration
  const columns = [
    {
      title: "To Do",
      todos: todoTodos,
      color: "bg-blue-500",
      id: "todo",
    },
    {
      title: "In Progress",
      todos: inProgressTodos,
      color: "bg-yellow-500",
      id: "in-progress",
    },
    {
      title: "Complete",
      todos: completeTodos,
      color: "bg-green-500",
      id: "complete",
    },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0">
        {columns.map(({ title, todos, color, id }) => (
        <KanbanColumn
            key={id}
            title={title}
            todos={todos}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          onFileClick={onFileClick}
            onViewTodo={onViewTodo}
            selectedTodos={selectedTodos}
            onSelectTodo={onSelectTodo}
            color={color}
            columnId={id}
            allowDrop={getColumnAllowDrop(id)}
            dropMessage={getDropMessage(id)}
            isDragOver={dragOverColumn === id}
            isDragging={isDragging}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="opacity-95 transform rotate-1 scale-110 shadow-2xl border-2 border-blue-400 rounded-xl bg-white dark:bg-gray-800">
            <SortableTodoItem
              todo={todos.find(todo => todo.id === activeId)}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleComplete={() => {}}
              onFileClick={() => {}}
              onViewTodo={() => {}}
              selectedTodos={selectedTodos}
              onSelectTodo={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </div>
  );
};

export default KanbanBoard;

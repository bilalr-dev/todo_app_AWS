import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
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
import { Badge, PriorityBadge } from './Badge';
import { 
  CheckCircle2, 
  Circle, 
  Edit, 
  Trash2, 
  File,
  Calendar,
  Clock,
  GripVertical,
  CheckSquare,
  Square
} from 'lucide-react';
import { cn, formatRelativeTime, formatDate, isToday, isTomorrow, isOverdue } from '../../utils/helpers';

// Helper function to get action time info
const getActionTimeInfo = (todo) => {
  const { state, created_at, updated_at, completed, started_at, completed_at } = todo;
  
  // For completed todos, show when they were completed (completed_at or updated_at as fallback)
  if (state === 'complete' || completed) {
    return {
      label: 'Completed at:',
      time: completed_at || updated_at
    };
  }
  
  // For in-progress todos, show when they were moved to in-progress (started_at or updated_at as fallback)
  if (state === 'inProgress') {
    return {
      label: 'Started at:',
      time: started_at || updated_at
    };
  }
  
  // For todo state, show when they were created
  return {
    label: 'Created at:',
    time: created_at
  };
};

// Helper function to get due date info (same as Dashboard)
const getDueDateInfo = (dueDate) => {
  if (!dueDate) return { text: 'No due date', className: 'text-muted-foreground' };
  
  if (isOverdue(dueDate)) {
    return { text: 'Overdue', className: 'text-red-600 font-medium' };
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

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    onToggleComplete(todo.id);
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
        "group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-all duration-200 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer",
        isDragging && "opacity-50 shadow-xl scale-105 rotate-2",
        todo.completed && "opacity-75",
        selectedTodos.includes(todo.id) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10"
      )}
      onClick={() => onViewTodo && onViewTodo(todo)}
    >
      {/* Todo content */}
      <div className="pr-20 pl-12">
        <div className="flex items-start space-x-3">
          {/* Bulk selection checkbox */}
          {onSelectTodo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectTodo(todo.id);
              }}
              disabled={todo.completed || todo.state === 'complete'}
              className={cn(
                "mt-1 transition-colors",
                (todo.completed || todo.state === 'complete')
                  ? "text-gray-300 cursor-not-allowed opacity-50" 
                  : "text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
              )}
              title={(todo.completed || todo.state === 'complete') ? "Cannot select completed todos" : "Select for bulk operations"}
            >
              {selectedTodos.includes(todo.id) ? (
                <CheckSquare className="w-5 h-5 text-blue-500" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          )}
          
          <button
            onClick={(e) => !todo.completed && handleToggleComplete(e)}
            disabled={todo.completed}
            className={cn(
              "mt-1 transition-colors",
              todo.completed 
                ? "text-gray-400 cursor-not-allowed opacity-60" 
                : "text-gray-400 hover:text-green-500 dark:text-gray-500 dark:hover:text-green-400"
            )}
            title={todo.completed ? "Cannot unmark completed todo" : "Mark as complete"}
          >
            {todo.completed ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium text-gray-900 dark:text-gray-100 mb-1",
              todo.completed && "line-through text-gray-500 dark:text-gray-400"
            )}>
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                {todo.description}
              </p>
            )}

            {/* Category and Priority */}
            <div className="flex items-center gap-2 mb-2">
              {todo.category && (
                <Badge variant="secondary" size="sm">
                  {todo.category}
                </Badge>
              )}
              <PriorityBadge priority={todo.priority} size="sm" />
            </div>


            {/* Due date */}
            {todo.due_date && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Calendar className="w-3 h-3" />
                <span className={getDueDateInfo(todo.due_date).className}>
                  {getDueDateInfo(todo.due_date).text}
                </span>
              </div>
            )}

            {/* Action time */}
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              <span>
                {getActionTimeInfo(todo).label} {formatRelativeTime(getActionTimeInfo(todo).time)}
              </span>
            </div>

            {/* File attachments */}
            {todo.file_count > 0 && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                <File className="w-3 h-3" />
                <span>{todo.file_count} file{todo.file_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex space-x-2">
          <button
            onClick={(e) => handleEdit(e)}
            className="p-2 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all duration-200"
            title="Edit todo"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleDelete(e)}
            className="p-2 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200"
            title="Delete todo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag handle */}
      <div 
        {...listeners}
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600"
        title="Drag to move"
      >
        <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
      </div>
    </div>
  );
};

// Column Component
const KanbanColumn = ({ title, todos, onEdit, onDelete, onToggleComplete, onFileClick, onViewTodo, selectedTodos = [], onSelectTodo, color, columnId, allowDrop = true, dropMessage = null }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    disabled: !allowDrop,
  });


  return (
    <div className="flex-1 min-w-0">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <div className={cn("w-3 h-3 rounded-full", color)}></div>
          <span>{title}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({todos.length})
          </span>
        </h2>
      </div>
      
      <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setNodeRef}
          className={cn(
            "space-y-3 min-h-[400px] p-2 border-2 border-dashed rounded-lg transition-all duration-200 relative",
            // Invalid drop zone styling
            !allowDrop && isOver && "border-red-400 bg-red-100 dark:bg-red-900/20 cursor-not-allowed shadow-lg",
            // Valid drop zone styling
            allowDrop && isOver && "border-green-400 bg-green-100 dark:bg-green-900/20 shadow-lg",
            // Default styling
            !isOver && "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          )}
        >
          {/* Drop message overlay */}
          {!allowDrop && isOver && dropMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-100/90 dark:bg-red-900/30 rounded-lg z-10 border-2 border-red-400">
              <div className="text-center p-4">
                <div className="text-red-700 dark:text-red-300 text-sm font-medium mb-1">
                  ❌ Cannot drop here
                </div>
                <div className="text-red-600 dark:text-red-400 text-xs">
                  {dropMessage}
                </div>
              </div>
            </div>
          )}
          
          {/* Valid drop indicator */}
          {allowDrop && isOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-100/90 dark:bg-green-900/30 rounded-lg z-10 border-2 border-green-400">
              <div className="text-center p-4">
                <div className="text-green-700 dark:text-green-300 text-sm font-medium mb-1">
                  ✅ Drop to move here
                </div>
                <div className="text-green-600 dark:text-green-400 text-xs">
                  {columnId === 'complete' ? 'Mark as complete' : `Move to ${title}`}
                </div>
              </div>
            </div>
          )}
          
          {todos.map((todo) => (
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
          ))}
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
    // Explicitly exclude completed todos first
    if (todo.completed || todo.state === 'complete') {
      return false;
    }
    // Handle todos with state field
    if (todo.state === 'todo') {
      return true;
    }
    // Fallback for todos without state field or with undefined state
    if (!todo.state || todo.state === undefined) {
      return !todo.completed;
    }
    return false;
  });
  
  const inProgressTodos = todos.filter(todo => todo.state === 'inProgress');
  
  const completeTodos = todos.filter(todo => {
    // Handle todos with state field
    if (todo.state === 'complete') {
      return true;
    }
    // Fallback for todos without state field or with undefined state
    if (!todo.state || todo.state === undefined) {
      return todo.completed;
    }
    // Also include todos that are marked as completed regardless of state
    return todo.completed;
  });
  

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
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

    // Determine target column based on overId
    let targetColumn = 'todo';
    
    // Check if dropped on a droppable area (column)
    if (overId === 'todo' || overId === 'in-progress' || overId === 'complete') {
      targetColumn = overId;
    } else {
      // If dropped on another todo, determine column by the todo's current state
      const overTodo = todos.find(todo => todo.id === overId);
      if (overTodo) {
        if (overTodo.state === 'complete') {
          targetColumn = 'complete';
        } else if (overTodo.state === 'inProgress') {
          targetColumn = 'in-progress';
        } else {
          targetColumn = 'todo';
        }
      }
    }

    // Determine current column based on todo state
    let currentColumn = 'todo';
    if (activeTodo.state === 'todo') {
      currentColumn = 'todo';
    } else if (activeTodo.state === 'inProgress') {
      currentColumn = 'in-progress';
    } else if (activeTodo.state === 'complete') {
      currentColumn = 'complete';
    } else {
      // Fallback for existing todos without state field or with undefined state
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
  };


  // Determine if columns should allow drops based on currently dragged item
  const getColumnAllowDrop = (columnId) => {
    if (!activeId) return true; // No active drag, allow all drops
    
    const activeTodo = todos.find(todo => todo.id === activeId);
    if (!activeTodo) return true;
    
    // Determine current column based on todo state
    let currentColumn = 'todo';
    if (activeTodo.state === 'todo') {
      currentColumn = 'todo';
    } else if (activeTodo.state === 'inProgress') {
      currentColumn = 'in-progress';
    } else if (activeTodo.state === 'complete') {
      currentColumn = 'complete';
    } else {
      // Fallback for existing todos without state field
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
    
    // Determine current column based on todo state
    let currentColumn = 'todo';
    if (activeTodo.state === 'todo') {
      currentColumn = 'todo';
    } else if (activeTodo.state === 'inProgress') {
      currentColumn = 'in-progress';
    } else if (activeTodo.state === 'complete') {
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KanbanColumn
          title="Todo"
          todos={todoTodos}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          onFileClick={onFileClick}
          onViewTodo={onViewTodo}
          selectedTodos={selectedTodos}
          onSelectTodo={onSelectTodo}
          color="bg-blue-500"
          columnId="todo"
          allowDrop={getColumnAllowDrop('todo')}
          dropMessage={getDropMessage('todo')}
        />
        
        <KanbanColumn
          title="In Progress"
          todos={inProgressTodos}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          onFileClick={onFileClick}
          onViewTodo={onViewTodo}
          selectedTodos={selectedTodos}
          onSelectTodo={onSelectTodo}
          color="bg-yellow-500"
          columnId="in-progress"
          allowDrop={getColumnAllowDrop('in-progress')}
          dropMessage={getDropMessage('in-progress')}
        />
        
        <KanbanColumn
          title="Complete"
          todos={completeTodos}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          onFileClick={onFileClick}
          onViewTodo={onViewTodo}
          selectedTodos={selectedTodos}
          onSelectTodo={onSelectTodo}
          color="bg-green-500"
          columnId="complete"
          allowDrop={getColumnAllowDrop('complete')}
          dropMessage={getDropMessage('complete')}
        />
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="opacity-90 transform rotate-2 scale-105 shadow-2xl">
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
  );
};

export default KanbanBoard;

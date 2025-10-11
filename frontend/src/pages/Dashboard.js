import React, { useState, useEffect } from 'react';
import { useTodos } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge, PriorityBadge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/Loading';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle,
  Edit,
  Trash2,
  Star
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, isToday, isTomorrow, isOverdue } from '../utils/helpers';
import { TODO_CONFIG } from '../utils/constants';

const Dashboard = () => {
  const {
    filteredTodos,
    stats,
    filters,
    sortBy,
    sortDirection,
    isLoading,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setFilters,
    setSort,
    clearFilters,
  } = useTodos();
  
  const { user } = useAuth();
  
  const [showFilters, setShowFilters] = useState(false);
  const [showNewTodo, setShowNewTodo] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    due_date: '',
  });
  const [editingTodo, setEditingTodo] = useState(null);

  // Load todos on component mount
  useEffect(() => {
    // Todos are loaded by the TodoProvider
  }, []);

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;
    
    const result = await createTodo(newTodo);
    if (result.success) {
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        due_date: '',
      });
      setShowNewTodo(false);
    }
  };

  const handleToggleTodo = async (id) => {
    await toggleTodo(id);
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      await deleteTodo(id);
    }
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category || '',
      due_date: todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : '',
    });
    setShowNewTodo(true);
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    
    if (!newTodo.title.trim()) return;
    
    const result = await updateTodo(editingTodo.id, newTodo);
    if (result.success) {
      setEditingTodo(null);
      setNewTodo({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        due_date: '',
      });
      setShowNewTodo(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const handleSortChange = (field) => {
    const newDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSort(field, newDirection);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what you need to focus on today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Todos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-success-600">{stats.completed}</p>
                </div>
                <div className="h-12 w-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
                </div>
                <div className="h-12 w-12 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center">
                  <Circle className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-error-600">{stats.high_priority}</p>
                </div>
                <div className="h-12 w-12 bg-error-100 dark:bg-error-900/20 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-error-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search todos..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            
            <Button
              onClick={() => setShowNewTodo(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Todo
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Priorities</option>
                    {TODO_CONFIG.PRIORITIES.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Categories</option>
                    {TODO_CONFIG.CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={filters.completed}
                    onChange={(e) => handleFilterChange('completed', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Due Date</label>
                  <select
                    value={filters.dueDate}
                    onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this_week">This Week</option>
                    <option value="overdue">Overdue</option>
                    <option value="no_date">No Date</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Todo Modal */}
        {showNewTodo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{editingTodo ? 'Edit Todo' : 'New Todo'}</CardTitle>
                <CardDescription>
                  {editingTodo ? 'Update your todo details' : 'Add a new todo to your list'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={editingTodo ? handleUpdateTodo : handleCreateTodo} className="space-y-4">
                  <Input
                    label="Title"
                    placeholder="What needs to be done?"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                    required
                  />
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <textarea
                      placeholder="Add details..."
                      value={newTodo.description}
                      onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                      className="w-full p-2 border border-input rounded-md bg-background min-h-[80px] resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Priority</label>
                      <select
                        value={newTodo.priority}
                        onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        {TODO_CONFIG.PRIORITIES.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        value={newTodo.category}
                        onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select category</option>
                        {TODO_CONFIG.CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <Input
                    label="Due Date"
                    type="date"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewTodo(false);
                        setEditingTodo(null);
                        setNewTodo({
                          title: '',
                          description: '',
                          priority: 'medium',
                          category: '',
                          due_date: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTodo ? 'Update' : 'Create'} Todo
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Todos List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <LoadingSkeleton key={i} lines={2} className="h-20" />
              ))}
            </div>
          ) : filteredTodos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mx-auto h-12 w-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No todos found</h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.priority !== 'all' || filters.category !== 'all' || filters.completed !== 'all' || filters.dueDate !== 'all'
                    ? 'Try adjusting your filters to see more todos'
                    : 'Get started by creating your first todo'
                  }
                </p>
                {!filters.search && filters.priority === 'all' && filters.category === 'all' && filters.completed === 'all' && filters.dueDate === 'all' && (
                  <Button onClick={() => setShowNewTodo(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Todo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map((todo) => {
              const dueDateInfo = getDueDateInfo(todo.due_date);
              
              return (
                <Card key={todo.id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <button
                          onClick={() => handleToggleTodo(todo.id)}
                          className="mt-1 hover:scale-110 transition-transform duration-200"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-success-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={cn(
                              "text-lg font-medium",
                              todo.completed && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </h3>
                            <PriorityBadge priority={todo.priority} size="sm" />
                            {todo.category && (
                              <Badge variant="outline" size="sm">
                                {TODO_CONFIG.CATEGORIES.find(c => c.value === todo.category)?.label || todo.category}
                              </Badge>
                            )}
                          </div>
                          
                          {todo.description && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {todo.description}
                            </p>
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
                                {formatRelativeTime(todo.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTodo(todo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

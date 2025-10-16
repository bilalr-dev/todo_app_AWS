/**
 * Unified export utility for todos and profile data
 * Handles both dashboard (todos only) and profile (complete data) exports
 */

export const exportData = (options = {}) => {
  const {
    todos = [],
    user = null,
    exportType = 'todos', // 'todos' or 'complete'
    selectedTodos = [],
    filename = null
  } = options;

  try {
    let todosToExport;
    let exportData;
    let defaultFilename;

    // Determine which todos to export
    if (selectedTodos.length > 0) {
      // Export only selected todos
      todosToExport = todos.filter(todo => selectedTodos.includes(todo.id));
    } else {
      // Export all todos
      todosToExport = todos;
    }

    if (todosToExport.length === 0) {
      throw new Error('No todos to export');
    }

    // Prepare todos data
    const todosData = todosToExport.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      category: todo.category,
      status: todo.status,
      due_date: todo.due_date,
      created_at: todo.created_at,
      updated_at: todo.updated_at,
      attachments: todo.attachments || [],
      file_count: todo.file_count || 0
    }));

    if (exportType === 'complete') {
      // Complete export: todos + account data
      exportData = {
        exportInfo: {
          exportedAt: new Date().toISOString(),
          exportedBy: user?.username || 'Unknown User',
          totalTodos: todosToExport.length,
          exportType: 'comprehensive',
          version: '1.0'
        },
        accountData: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          created_at: user?.created_at,
          last_login: user?.last_login
        },
        todos: todosData
      };
      defaultFilename = `complete_data_export_${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // Todos only export
      exportData = todosData;
      defaultFilename = `todos_export_${new Date().toISOString().split('T')[0]}.json`;
    }

    // Create and download the file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      message: exportType === 'complete' 
        ? `Successfully exported complete data: ${todosToExport.length} todos and account information`
        : `Successfully exported ${todosToExport.length} todo${todosToExport.length !== 1 ? 's' : ''}`,
      count: todosToExport.length
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to export data'
    };
  }
};

export default exportData;

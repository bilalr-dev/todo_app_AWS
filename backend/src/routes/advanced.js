// Advanced filtering and search routes for v0.6
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Todo = require('../models/Todo');
const { logger } = require('../utils/logger');

const router = express.Router();

// Advanced search with multiple filters
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      search = null,
      priorities = null,
      categories = null,
      status = null,
      startDate = null,
      endDate = null,
      dueStartDate = null,
      dueEndDate = null,
      hasFiles = null,
      sortBy = 'created_at',
      sortDirection = 'DESC',
      page = 1,
      limit = 10
    } = req.query;

    // Parse array parameters
    const priorityArray = priorities ? priorities.split(',').map(p => p.trim()) : null;
    const categoryArray = categories ? categories.split(',').map(c => c.trim()) : null;

    // Build filter options
    const options = {
      search,
      priority: priorityArray,
      category: categoryArray,
      status,
      startDate,
      endDate,
      dueStartDate,
      dueEndDate,
      hasFiles,
      sortBy,
      sortDirection,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await Todo.findWithAdvancedFilters(userId, options);

    res.json({
      success: true,
      ...result,
      filters: {
        search,
        priorities: priorityArray,
        categories: categoryArray,
        status,
        startDate,
        endDate,
        dueStartDate,
        dueEndDate,
        hasFiles,
        sortBy,
        sortDirection
      }
    });
  } catch (error) {
    logger.error('Error in advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing advanced search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available filter options
router.get('/filter-options', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { query } = require('../config/database');

    // Get unique priorities
    const prioritiesResult = await query(
      'SELECT DISTINCT priority FROM todos WHERE user_id = $1 AND priority IS NOT NULL ORDER BY priority',
      [userId]
    );

    // Get unique categories
    const categoriesResult = await query(
      'SELECT DISTINCT category FROM todos WHERE user_id = $1 AND category IS NOT NULL AND category != \'\' ORDER BY category',
      [userId]
    );

    // Get date ranges
    const dateRangesResult = await query(
      `SELECT 
         MIN(created_at) as earliest_created,
         MAX(created_at) as latest_created,
         MIN(due_date) as earliest_due,
         MAX(due_date) as latest_due
       FROM todos 
       WHERE user_id = $1`,
      [userId]
    );

    // Get file statistics
    const fileStatsResult = await query(
      `SELECT 
         COUNT(*) as total_todos,
         COUNT(CASE WHEN file_count > 0 THEN 1 END) as todos_with_files,
         COUNT(CASE WHEN file_count = 0 THEN 1 END) as todos_without_files
       FROM todos 
       WHERE user_id = $1`,
      [userId]
    );

    const filterOptions = {
      priorities: prioritiesResult.rows.map(row => row.priority),
      categories: categoriesResult.rows.map(row => row.category),
      dateRanges: {
        created: {
          earliest: dateRangesResult.rows[0]?.earliest_created,
          latest: dateRangesResult.rows[0]?.latest_created
        },
        due: {
          earliest: dateRangesResult.rows[0]?.earliest_due,
          latest: dateRangesResult.rows[0]?.latest_due
        }
      },
      fileStats: {
        totalTodos: parseInt(fileStatsResult.rows[0]?.total_todos) || 0,
        todosWithFiles: parseInt(fileStatsResult.rows[0]?.todos_with_files) || 0,
        todosWithoutFiles: parseInt(fileStatsResult.rows[0]?.todos_without_files) || 0
      },
      sortOptions: [
        { value: 'created_at', label: 'Created Date' },
        { value: 'updated_at', label: 'Updated Date' },
        { value: 'due_date', label: 'Due Date' },
        { value: 'title', label: 'Title' },
        { value: 'priority', label: 'Priority' },
        { value: 'category', label: 'Category' }
      ],
      statusOptions: [
        { value: 'all', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' }
      ]
    };

    res.json({
      success: true,
      filterOptions
    });
  } catch (error) {
    logger.error('Error getting filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting filter options',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get search suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q: query, type = 'all' } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const { query: dbQuery } = require('../config/database');
    const suggestions = [];

    if (type === 'all' || type === 'titles') {
      // Get title suggestions
      const titleResult = await dbQuery(
        `SELECT DISTINCT title FROM todos 
         WHERE user_id = $1 AND title ILIKE $2 
         ORDER BY title 
         LIMIT 5`,
        [userId, `%${query}%`]
      );
      suggestions.push(...titleResult.rows.map(row => ({
        type: 'title',
        value: row.title,
        label: `Title: ${row.title}`
      })));
    }

    if (type === 'all' || type === 'categories') {
      // Get category suggestions
      const categoryResult = await dbQuery(
        `SELECT DISTINCT category FROM todos 
         WHERE user_id = $1 AND category ILIKE $2 AND category IS NOT NULL AND category != ''
         ORDER BY category 
         LIMIT 5`,
        [userId, `%${query}%`]
      );
      suggestions.push(...categoryResult.rows.map(row => ({
        type: 'category',
        value: row.category,
        label: `Category: ${row.category}`
      })));
    }

    if (type === 'all' || type === 'descriptions') {
      // Get description suggestions (first 50 chars)
      const descResult = await dbQuery(
        `SELECT DISTINCT LEFT(description, 50) as description FROM todos 
         WHERE user_id = $1 AND description ILIKE $2 AND description IS NOT NULL AND description != ''
         ORDER BY description 
         LIMIT 5`,
        [userId, `%${query}%`]
      );
      suggestions.push(...descResult.rows.map(row => ({
        type: 'description',
        value: row.description,
        label: `Description: ${row.description}...`
      })));
    }

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 10) // Limit total suggestions
    });
  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting search suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get analytics data
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    const { query } = require('../config/database');

    // Calculate date range based on period
    let dateFilter = '';
    let params = [userId];
    
    switch (period) {
      case '7d':
        dateFilter = 'AND created_at >= NOW() - INTERVAL \'7 days\'';
        break;
      case '30d':
        dateFilter = 'AND created_at >= NOW() - INTERVAL \'30 days\'';
        break;
      case '90d':
        dateFilter = 'AND created_at >= NOW() - INTERVAL \'90 days\'';
        break;
      case '1y':
        dateFilter = 'AND created_at >= NOW() - INTERVAL \'1 year\'';
        break;
      default:
        dateFilter = 'AND created_at >= NOW() - INTERVAL \'30 days\'';
    }

    // Get completion rate over time
    const completionResult = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as total_created,
         COUNT(CASE WHEN completed = true THEN 1 END) as completed
       FROM todos 
       WHERE user_id = $1 ${dateFilter}
       GROUP BY DATE(created_at)
       ORDER BY date`,
      params
    );

    // Get priority distribution
    const priorityResult = await query(
      `SELECT 
         priority,
         COUNT(*) as count
       FROM todos 
       WHERE user_id = $1 ${dateFilter}
       GROUP BY priority
       ORDER BY priority`,
      params
    );

    // Get category distribution
    const categoryResult = await query(
      `SELECT 
         COALESCE(category, 'Uncategorized') as category,
         COUNT(*) as count
       FROM todos 
       WHERE user_id = $1 ${dateFilter}
       GROUP BY category
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    // Get file attachment statistics
    const fileResult = await query(
      `SELECT 
         COUNT(*) as total_todos,
         COUNT(CASE WHEN file_count > 0 THEN 1 END) as todos_with_files,
         SUM(file_count) as total_files
       FROM todos 
       WHERE user_id = $1 ${dateFilter}`,
      params
    );

    const analytics = {
      period,
      completionRate: completionResult.rows.map(row => ({
        date: row.date,
        totalCreated: parseInt(row.total_created),
        completed: parseInt(row.completed),
        completionRate: row.total_created > 0 ? (row.completed / row.total_created * 100).toFixed(1) : 0
      })),
      priorityDistribution: priorityResult.rows.map(row => ({
        priority: row.priority,
        count: parseInt(row.count)
      })),
      categoryDistribution: categoryResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count)
      })),
      fileStats: {
        totalTodos: parseInt(fileResult.rows[0]?.total_todos) || 0,
        todosWithFiles: parseInt(fileResult.rows[0]?.todos_with_files) || 0,
        totalFiles: parseInt(fileResult.rows[0]?.total_files) || 0
      }
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting analytics data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;

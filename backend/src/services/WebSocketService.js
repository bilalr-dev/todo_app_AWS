// WebSocket Service for Todo App v0.7
// Real-time communication with Socket.io and Redis adapter

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const User = require('../models/User');

class WebSocketService {
  constructor(server) {
    this.io = null;
    this.pubClient = null;
    this.subClient = null;
    this.connectedUsers = new Map();
    
    this.initializeServer(server);
  }

  async initializeServer(server) {
    try {
      // Initialize Socket.io server
      this.io = new Server(server, {
        cors: {
          origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      });

      // Setup Redis adapter for scaling
      await this.setupRedisAdapter();
      
      // Setup authentication middleware
      this.setupAuthentication();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      // Setup connection monitoring
      this.setupConnectionMonitoring();
      
      logger.info('WebSocket server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  async setupRedisAdapter() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.pubClient = redis.createClient({ url: redisUrl });
      this.subClient = this.pubClient.duplicate();
      
      await Promise.all([
        this.pubClient.connect(),
        this.subClient.connect()
      ]);
      
      this.io.adapter(createAdapter(this.pubClient, this.subClient));
      
      logger.info('Redis adapter configured for WebSocket scaling');
    } catch (error) {
      logger.error('Failed to setup Redis adapter:', error);
      // Continue without Redis adapter for development
      logger.warn('Continuing without Redis adapter - single instance mode');
    }
  }

  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.userId = user.id;
        socket.user = user;
        
        // Track connected user
        this.connectedUsers.set(user.id, {
          socketId: socket.id,
          user: user,
          connectedAt: new Date()
        });

        logger.info(`User ${user.username} connected via WebSocket`);
        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket connection established: ${socket.id} for user ${socket.user.username}`);

      // Join user to their personal room
      const room = `user_${socket.userId}`;
      socket.join(room);
      logger.info(`User ${socket.userId} joined room ${room}`);

      // Handle todo events
      this.setupTodoEventHandlers(socket);
      
      // Handle file events
      this.setupFileEventHandlers(socket);
      
      // Handle user activity events
      this.setupUserActivityHandlers(socket);
      
      // Handle notification events
      this.setupNotificationEventHandlers(socket);
      
      // Handle theme change events
      this.setupThemeEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`User ${socket.user.username} disconnected: ${reason}`);
        this.connectedUsers.delete(socket.userId);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`WebSocket error for user ${socket.user.username}:`, error);
      });
    });
  }

  setupTodoEventHandlers(socket) {
    // Todo created event
    socket.on('todo_created', (data) => {
      this.broadcastToUser(socket.userId, 'todo_created', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Todo updated event
    socket.on('todo_updated', (data) => {
      this.broadcastToUser(socket.userId, 'todo_updated', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Todo deleted event
    socket.on('todo_deleted', (data) => {
      this.broadcastToUser(socket.userId, 'todo_deleted', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // Todo moved event (Kanban)
    socket.on('todo_moved', (data) => {
      this.broadcastToUser(socket.userId, 'todo_moved', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  setupFileEventHandlers(socket) {
    // File uploaded event
    socket.on('file_uploaded', (data) => {
      this.broadcastToUser(socket.userId, 'file_uploaded', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // File deleted event
    socket.on('file_deleted', (data) => {
      this.broadcastToUser(socket.userId, 'file_deleted', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  setupUserActivityHandlers(socket) {
    // User activity tracking
    socket.on('user_activity', (data) => {
      this.broadcastToUser(socket.userId, 'user_activity', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  setupNotificationEventHandlers(socket) {
    // Notification read event
    socket.on('notification_read', (data) => {
      this.broadcastToUser(socket.userId, 'notification_read', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  setupThemeEventHandlers(socket) {
    // Theme change event
    socket.on('theme_changed', (data) => {
      logger.info(`Theme changed to ${data.theme} by user ${socket.userId}`);
      
      this.broadcastToUser(socket.userId, 'theme_changed', {
        ...data,
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  }

  setupConnectionMonitoring() {
    // Heartbeat monitoring
    setInterval(() => {
      this.io.emit('ping', { timestamp: Date.now() });
    }, 30000);

    // Connection health check
    setInterval(() => {
      const connectedCount = this.connectedUsers.size;
      logger.debug(`WebSocket health check: ${connectedCount} connected users`);
    }, 60000);
  }

  // Broadcast to specific user across all their connections
  broadcastToUser(userId, event, data) {
    const room = `user_${userId}`;
    const roomSize = this.io.sockets.adapter.rooms.get(room)?.size || 0;
    logger.info(`Broadcasting ${event} to user ${userId} in room ${room} (${roomSize} connections)`);
    this.io.to(room).emit(event, data);
    logger.debug(`Broadcasted ${event} to user ${userId}`);
  }

  // Broadcast to all connected users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
    logger.debug(`Broadcasted ${event} to all users`);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get user connection info
  getUserConnection(userId) {
    return this.connectedUsers.get(userId);
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }

  // Graceful shutdown
  async shutdown() {
    try {
      if (this.io) {
        this.io.close();
      }
      
      if (this.pubClient) {
        await this.pubClient.quit();
      }
      
      if (this.subClient) {
        await this.subClient.quit();
      }
      
      logger.info('WebSocket service shutdown completed');
    } catch (error) {
      logger.error('Error during WebSocket shutdown:', error);
    }
  }
}

module.exports = WebSocketService;

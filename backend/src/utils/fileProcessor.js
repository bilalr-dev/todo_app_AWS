// File processing utilities for v0.6
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('./logger');
const { query } = require('../config/database');

class FileProcessor {
  constructor() {
    // Use __dirname to get the current directory (backend/src/utils), then go up to backend and navigate to uploads
    this.uploadDir = path.join(__dirname, '..', '..', 'uploads');
    this.thumbnailDir = path.join(__dirname, '..', '..', 'uploads', 'thumbnails');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      logger.error('Error creating upload directories:', error);
    }
  }

  // Generate thumbnail for images
  async generateThumbnail(filePath, filename) {
    try {
      const thumbnailPath = path.join(this.thumbnailDir, `thumb_${filename}`);
      
      logger.info('fileProcessor: generateThumbnail called', { 
        filePath, 
        filename, 
        thumbnailPath,
        thumbnailDir: this.thumbnailDir 
      });
      
      // Check if source file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        logger.error('Source file does not exist:', filePath);
        return null;
      }
      
      await sharp(filePath)
        .resize(200, 200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      logger.info('fileProcessor: Thumbnail file created successfully', { thumbnailPath });
      return thumbnailPath;
    } catch (error) {
      logger.error('Error generating thumbnail:', error);
      return null;
    }
  }

  // Get file information
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error('Error getting file info:', error);
      return null;
    }
  }

  // Validate file size
  validateFileSize(fileSize, maxSize = 10 * 1024 * 1024) {
    return fileSize <= maxSize;
  }

  // Get file type category
  getFileTypeCategory(mimeType) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    const textTypes = ['text/plain', 'text/csv', 'application/json', 'text/markdown'];

    if (imageTypes.includes(mimeType)) return 'image';
    if (documentTypes.includes(mimeType)) return 'document';
    if (textTypes.includes(mimeType)) return 'text';
    
    return 'other';
  }

  // Delete file and its thumbnail
  async deleteFile(filePath, thumbnailPath = null) {
    try {
      const promises = [fs.unlink(filePath)];
      
      if (thumbnailPath) {
        promises.push(fs.unlink(thumbnailPath));
      }
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file extension
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  // Check if file is an image
  isImage(mimeType) {
    return mimeType.startsWith('image/');
  }

  // Get relative path from uploads directory
  getRelativePath(fullPath) {
    return path.relative(this.uploadDir, fullPath);
  }

  // Get thumbnail relative path
  getThumbnailRelativePath(thumbnailPath) {
    return path.relative(this.uploadDir, thumbnailPath);
  }

  // Process uploaded file
  async processFile(file) {
    try {
      const fileInfo = await this.getFileInfo(file.path);
      const fileType = this.getFileTypeCategory(file.mimetype);
      
      let thumbnailPath = null;
      
      // Generate thumbnail for images
      if (this.isImage(file.mimetype)) {
        logger.debug('fileProcessor: Generating thumbnail for image', { 
          filePath: file.path, 
          filename: file.filename, 
          mimeType: file.mimetype 
        });
        thumbnailPath = await this.generateThumbnail(file.path, file.filename);
        logger.debug('fileProcessor: Thumbnail generated', { 
          thumbnailPath, 
          relativePath: thumbnailPath ? this.getThumbnailRelativePath(thumbnailPath) : null 
        });
      } else {
        logger.debug('fileProcessor: Skipping thumbnail generation for non-image', { 
          mimeType: file.mimetype 
        });
      }

      const result = {
        filename: file.filename,
        originalName: file.originalname,
        filePath: this.getRelativePath(file.path),
        fileSize: fileInfo.size,
        mimeType: file.mimetype,
        fileType: fileType,
        thumbnailPath: thumbnailPath ? this.getThumbnailRelativePath(thumbnailPath) : null,
        created: fileInfo.created,
        modified: fileInfo.modified
      };

      logger.debug('fileProcessor: processFile result', result);
      return result;
    } catch (error) {
      logger.error('Error processing file:', error);
      throw error;
    }
  }

  // Get file URL for serving
  getFileUrl(filePath, baseUrl = '') {
    return `${baseUrl}/uploads/${filePath}`;
  }

  // Get thumbnail URL for serving
  getThumbnailUrl(thumbnailPath, baseUrl = '') {
    return `${baseUrl}/uploads/thumbnails/${path.basename(thumbnailPath)}`;
  }

  // Resolve duplicate filename for the same todo (Windows/macOS style)
  async resolveDuplicateFilename(todoId, originalName) {
    try {
      // Get all existing attachments for this todo
      const result = await query(
        'SELECT file_name FROM file_attachments WHERE todo_id = $1',
        [todoId]
      );

      const existingNames = result.rows.map(row => row.file_name);
      
      // If no duplicate, return original name
      if (!existingNames.includes(originalName)) {
        return originalName;
      }

      // Extract name and extension
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      
      // Find the highest number used for this base name
      let maxNumber = 0;
      const namePattern = new RegExp(`^${nameWithoutExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\((\\d+)\\)${ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      
      for (const existingName of existingNames) {
        const match = existingName.match(namePattern);
        if (match) {
          const number = parseInt(match[1]);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      }

      // Generate new name with incremented number
      const newNumber = maxNumber + 1;
      let newName = `${nameWithoutExt}(${newNumber})${ext}`;
      
      // Keep incrementing until we find a name that doesn't exist
      let counter = newNumber;
      while (existingNames.includes(newName)) {
        counter++;
        newName = `${nameWithoutExt}(${counter})${ext}`;
      }
      
      return newName;
    } catch (error) {
      logger.error('Error resolving duplicate filename:', error);
      // Fallback: add timestamp to make it unique
      const ext = path.extname(originalName);
      const nameWithoutExt = path.basename(originalName, ext);
      const timestamp = Date.now();
      return `${nameWithoutExt}_${timestamp}${ext}`;
    }
  }
}

module.exports = new FileProcessor();

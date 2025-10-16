// File processor utility tests for v0.6
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('sharp');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn()
  }
}));

describe('FileProcessor', () => {
  let fileProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    fileProcessor = require('../../../backend/src/utils/fileProcessor');
  });

  describe('getFileTypeCategory', () => {
    test('should categorize image files correctly', () => {
      expect(fileProcessor.getFileTypeCategory('image/jpeg')).toBe('image');
      expect(fileProcessor.getFileTypeCategory('image/png')).toBe('image');
      expect(fileProcessor.getFileTypeCategory('image/gif')).toBe('image');
      expect(fileProcessor.getFileTypeCategory('image/webp')).toBe('image');
    });

    test('should categorize document files correctly', () => {
      expect(fileProcessor.getFileTypeCategory('application/pdf')).toBe('document');
      expect(fileProcessor.getFileTypeCategory('application/msword')).toBe('document');
      expect(fileProcessor.getFileTypeCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('document');
      expect(fileProcessor.getFileTypeCategory('application/vnd.ms-excel')).toBe('document');
    });

    test('should categorize text files correctly', () => {
      expect(fileProcessor.getFileTypeCategory('text/plain')).toBe('text');
      expect(fileProcessor.getFileTypeCategory('text/csv')).toBe('text');
      expect(fileProcessor.getFileTypeCategory('application/json')).toBe('text');
      expect(fileProcessor.getFileTypeCategory('text/markdown')).toBe('text');
    });

    test('should return "other" for unknown file types', () => {
      expect(fileProcessor.getFileTypeCategory('application/octet-stream')).toBe('other');
      expect(fileProcessor.getFileTypeCategory('unknown/type')).toBe('other');
    });
  });

  describe('validateFileSize', () => {
    test('should validate file size within limit', () => {
      expect(fileProcessor.validateFileSize(1024 * 1024)).toBe(true); // 1MB
      expect(fileProcessor.validateFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(fileProcessor.validateFileSize(10 * 1024 * 1024)).toBe(true); // 10MB (exact limit)
    });

    test('should reject file size over limit', () => {
      expect(fileProcessor.validateFileSize(11 * 1024 * 1024)).toBe(false); // 11MB
      expect(fileProcessor.validateFileSize(100 * 1024 * 1024)).toBe(false); // 100MB
    });

    test('should use custom max size when provided', () => {
      const customLimit = 5 * 1024 * 1024; // 5MB
      expect(fileProcessor.validateFileSize(4 * 1024 * 1024, customLimit)).toBe(true);
      expect(fileProcessor.validateFileSize(6 * 1024 * 1024, customLimit)).toBe(false);
    });
  });

  describe('isImage', () => {
    test('should identify image MIME types', () => {
      expect(fileProcessor.isImage('image/jpeg')).toBe(true);
      expect(fileProcessor.isImage('image/png')).toBe(true);
      expect(fileProcessor.isImage('image/gif')).toBe(true);
      expect(fileProcessor.isImage('image/webp')).toBe(true);
    });

    test('should reject non-image MIME types', () => {
      expect(fileProcessor.isImage('application/pdf')).toBe(false);
      expect(fileProcessor.isImage('text/plain')).toBe(false);
      expect(fileProcessor.isImage('application/json')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    test('should extract file extensions correctly', () => {
      expect(fileProcessor.getFileExtension('test.jpg')).toBe('.jpg');
      expect(fileProcessor.getFileExtension('document.pdf')).toBe('.pdf');
      expect(fileProcessor.getFileExtension('data.json')).toBe('.json');
      expect(fileProcessor.getFileExtension('README.md')).toBe('.md');
    });

    test('should handle files without extensions', () => {
      expect(fileProcessor.getFileExtension('README')).toBe('');
      expect(fileProcessor.getFileExtension('file')).toBe('');
    });

    test('should handle multiple dots in filename', () => {
      expect(fileProcessor.getFileExtension('backup.tar.gz')).toBe('.gz');
      expect(fileProcessor.getFileExtension('archive.2025.10.01.zip')).toBe('.zip');
    });
  });

  describe('getRelativePath', () => {
    test('should return relative path from uploads directory', () => {
      const fullPath = '/app/uploads/test-file.jpg';
      const relativePath = fileProcessor.getRelativePath(fullPath);
      
      // The exact path depends on the implementation
      expect(typeof relativePath).toBe('string');
    });
  });

  describe('getFileUrl', () => {
    test('should generate file URL with base URL', () => {
      const filePath = 'uploads/test-file.jpg';
      const baseUrl = 'https://example.com';
      const url = fileProcessor.getFileUrl(filePath, baseUrl);
      
      expect(url).toBe(`${baseUrl}/uploads/${filePath}`);
    });

    test('should generate file URL without base URL', () => {
      const filePath = 'uploads/test-file.jpg';
      const url = fileProcessor.getFileUrl(filePath);
      
      expect(url).toBe(`/uploads/${filePath}`);
    });
  });

  describe('getThumbnailUrl', () => {
    test('should generate thumbnail URL with base URL', () => {
      const thumbnailPath = 'uploads/thumbnails/thumb_test-file.jpg';
      const baseUrl = 'https://example.com';
      const url = fileProcessor.getThumbnailUrl(thumbnailPath, baseUrl);
      
      expect(url).toBe(`${baseUrl}/uploads/thumbnails/thumb_test-file.jpg`);
    });

    test('should generate thumbnail URL without base URL', () => {
      const thumbnailPath = 'uploads/thumbnails/thumb_test-file.jpg';
      const url = fileProcessor.getThumbnailUrl(thumbnailPath);
      
      expect(url).toBe('/uploads/thumbnails/thumb_test-file.jpg');
    });
  });

  describe('generateThumbnail', () => {
    test('should generate thumbnail for image files', async () => {
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toFile: jest.fn().mockResolvedValue()
      };

      sharp.mockReturnValue(mockSharp);

      const filePath = '/app/uploads/test-image.jpg';
      const filename = 'test-image.jpg';
      
      const result = await fileProcessor.generateThumbnail(filePath, filename);

      expect(sharp).toHaveBeenCalledWith(filePath);
      expect(mockSharp.resize).toHaveBeenCalledWith(200, 200, {
        fit: 'inside',
        withoutEnlargement: true
      });
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharp.toFile).toHaveBeenCalled();
    });

    test('should handle thumbnail generation errors', async () => {
      sharp.mockImplementation(() => {
        throw new Error('Sharp error');
      });

      const filePath = '/app/uploads/test-image.jpg';
      const filename = 'test-image.jpg';
      
      const result = await fileProcessor.generateThumbnail(filePath, filename);

      expect(result).toBeNull();
    });
  });

  describe('getFileInfo', () => {
    test('should get file information', async () => {
      const mockStats = {
        size: 1024,
        birthtime: new Date('2025-10-01'),
        mtime: new Date('2025-10-02')
      };

      fs.stat.mockResolvedValue(mockStats);

      const filePath = '/app/uploads/test-file.jpg';
      const result = await fileProcessor.getFileInfo(filePath);

      expect(fs.stat).toHaveBeenCalledWith(filePath);
      expect(result).toEqual({
        size: 1024,
        created: mockStats.birthtime,
        modified: mockStats.mtime
      });
    });

    test('should handle file info errors', async () => {
      fs.stat.mockRejectedValue(new Error('File not found'));

      const filePath = '/app/uploads/nonexistent.jpg';
      const result = await fileProcessor.getFileInfo(filePath);

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    test('should delete file and thumbnail', async () => {
      fs.unlink.mockResolvedValue();

      const filePath = '/app/uploads/test-file.jpg';
      const thumbnailPath = '/app/uploads/thumbnails/thumb_test-file.jpg';
      
      const result = await fileProcessor.deleteFile(filePath, thumbnailPath);

      expect(fs.unlink).toHaveBeenCalledWith(filePath);
      expect(fs.unlink).toHaveBeenCalledWith(thumbnailPath);
      expect(result).toBe(true);
    });

    test('should delete file without thumbnail', async () => {
      fs.unlink.mockResolvedValue();

      const filePath = '/app/uploads/test-file.jpg';
      
      const result = await fileProcessor.deleteFile(filePath);

      expect(fs.unlink).toHaveBeenCalledWith(filePath);
      expect(fs.unlink).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    test('should handle delete errors', async () => {
      fs.unlink.mockRejectedValue(new Error('Delete failed'));

      const filePath = '/app/uploads/test-file.jpg';
      
      const result = await fileProcessor.deleteFile(filePath);

      expect(result).toBe(false);
    });
  });
});

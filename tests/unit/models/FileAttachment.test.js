// FileAttachment model tests for v0.6
const FileAttachment = require('../../../backend/src/models/FileAttachment');

// Mock database
jest.mock('../../../backend/src/config/database', () => ({
  query: jest.fn()
}));

const { query } = require('../../../backend/src/config/database');

describe('FileAttachment Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create FileAttachment instance with correct properties', () => {
      const data = {
        id: 1,
        todo_id: 1,
        filename: 'test-file.jpg',
        original_name: 'test-file.jpg',
        file_path: 'uploads/test-file.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        file_type: 'image',
        thumbnail_path: 'uploads/thumbnails/thumb_test-file.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const attachment = new FileAttachment(data);

      expect(attachment.id).toBe(1);
      expect(attachment.todo_id).toBe(1);
      expect(attachment.filename).toBe('test-file.jpg');
      expect(attachment.original_name).toBe('test-file.jpg');
      expect(attachment.file_path).toBe('uploads/test-file.jpg');
      expect(attachment.file_size).toBe(1024);
      expect(attachment.mime_type).toBe('image/jpeg');
      expect(attachment.file_type).toBe('image');
      expect(attachment.thumbnail_path).toBe('uploads/thumbnails/thumb_test-file.jpg');
    });
  });

  describe('create', () => {
    test('should create a new file attachment', async () => {
      const attachmentData = {
        todo_id: 1,
        filename: 'test-file.jpg',
        original_name: 'test-file.jpg',
        file_path: 'uploads/test-file.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        file_type: 'image',
        thumbnail_path: 'uploads/thumbnails/thumb_test-file.jpg'
      };

      const mockResult = {
        rows: [{
          id: 1,
          ...attachmentData,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      };

      query.mockResolvedValueOnce(mockResult);

      const result = await FileAttachment.create(attachmentData);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO file_attachments'),
        expect.arrayContaining([
          1, 'test-file.jpg', 'test-file.jpg', 'uploads/test-file.jpg',
          1024, 'image/jpeg', 'image', 'uploads/thumbnails/thumb_test-file.jpg'
        ])
      );

      expect(result).toBeInstanceOf(FileAttachment);
      expect(result.id).toBe(1);
    });
  });

  describe('findById', () => {
    test('should find file attachment by ID', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          todo_id: 1,
          filename: 'test-file.jpg',
          original_name: 'test-file.jpg',
          file_path: 'uploads/test-file.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          file_type: 'image',
          thumbnail_path: 'uploads/thumbnails/thumb_test-file.jpg',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]
      };

      query.mockResolvedValueOnce(mockResult);

      const result = await FileAttachment.findById(1);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM file_attachments WHERE id = $1',
        [1]
      );

      expect(result).toBeInstanceOf(FileAttachment);
      expect(result.id).toBe(1);
    });

    test('should return null if file attachment not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const result = await FileAttachment.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByTodoId', () => {
    test('should find file attachments by todo ID', async () => {
      const mockResult = {
        rows: [
          {
            id: 1,
            todo_id: 1,
            filename: 'test-file1.jpg',
            original_name: 'test-file1.jpg',
            file_path: 'uploads/test-file1.jpg',
            file_size: 1024,
            mime_type: 'image/jpeg',
            file_type: 'image',
            thumbnail_path: 'uploads/thumbnails/thumb_test-file1.jpg',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 2,
            todo_id: 1,
            filename: 'test-file2.pdf',
            original_name: 'test-file2.pdf',
            file_path: 'uploads/test-file2.pdf',
            file_size: 2048,
            mime_type: 'application/pdf',
            file_type: 'document',
            thumbnail_path: null,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ]
      };

      query.mockResolvedValueOnce(mockResult);

      const result = await FileAttachment.findByTodoId(1);

      expect(query).toHaveBeenCalledWith(
        'SELECT * FROM file_attachments WHERE todo_id = $1 ORDER BY created_at DESC',
        [1]
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(FileAttachment);
      expect(result[1]).toBeInstanceOf(FileAttachment);
    });
  });

  describe('getStats', () => {
    test('should get file attachment statistics for user', async () => {
      const mockResult = {
        rows: [{
          total_files: '5',
          image_files: '3',
          document_files: '2',
          text_files: '0',
          total_size: '10240'
        }]
      };

      query.mockResolvedValueOnce(mockResult);

      const result = await FileAttachment.getStats(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );

      expect(result).toEqual({
        total_files: 5,
        image_files: 3,
        document_files: 2,
        text_files: 0,
        total_size: 10240
      });
    });
  });

  describe('delete', () => {
    test('should delete file attachment', async () => {
      const attachment = new FileAttachment({
        id: 1,
        todo_id: 1,
        filename: 'test-file.jpg',
        original_name: 'test-file.jpg',
        file_path: 'uploads/test-file.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        file_type: 'image',
        thumbnail_path: 'uploads/thumbnails/thumb_test-file.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      });

      query.mockResolvedValueOnce({});

      const result = await attachment.delete();

      expect(query).toHaveBeenCalledWith(
        'DELETE FROM file_attachments WHERE id = $1',
        [1]
      );

      expect(result).toBe(true);
    });
  });

  describe('toJSON', () => {
    test('should convert FileAttachment to JSON', () => {
      const data = {
        id: 1,
        todo_id: 1,
        filename: 'test-file.jpg',
        original_name: 'test-file.jpg',
        file_path: 'uploads/test-file.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        file_type: 'image',
        thumbnail_path: 'uploads/thumbnails/thumb_test-file.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const attachment = new FileAttachment(data);
      const json = attachment.toJSON();

      expect(json).toEqual(data);
    });
  });
});

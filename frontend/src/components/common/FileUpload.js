// File upload component for v0.6 - Deferred upload version
import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const FileUpload = forwardRef(({ 
  todoId, 
  onFilesChange, 
  onDelete, 
  multiple = false, 
  maxFiles = 5, 
  className = '',
  existingAttachments = [],
  deletingFiles = new Set()
}, ref) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cancelledRef = useRef(false);
  const { dialogState, showConfirm, handleConfirm, handleCancel } = useConfirmDialog();

  // Notify parent component when selectedFiles changes
  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(selectedFiles);
    }
  }, [selectedFiles, onFilesChange]);

  // Cancel pending uploads
  const cancelUploads = useCallback(() => {
    if (cancelledRef.current && typeof cancelledRef.current === 'object') {
      cancelledRef.current.cancelled = true;
    }
    setSelectedFiles(prev => prev.map(fileData => ({
      ...fileData,
      status: 'cancelled',
      progress: 0
    })));
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    uploadFiles: uploadSelectedFiles,
    clearFiles: clearSelectedFiles,
    cancelUploads: cancelUploads,
    getSelectedFiles: () => selectedFiles
  }));

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (file.type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (file.type.includes('word') || file.type.includes('excel')) return <FileText className="w-4 h-4 text-green-500" />;
    if (file.type.startsWith('text/')) return <FileText className="w-4 h-4 text-gray-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit.`;
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only images, PDFs, Word, Excel, and text files are allowed.';
    }

    return null;
  };

  const handleFiles = useCallback((fileList) => {
    const newFiles = Array.from(fileList).map(file => {
      const validationError = validateFile(file);
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        error: validationError,
        status: validationError ? 'error' : 'pending'
      };
    });

    if (multiple) {
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
    } else {
      setSelectedFiles(newFiles.slice(0, 1));
    }
  }, [multiple, maxFiles]);

  const removeFile = useCallback((fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearSelectedFiles = useCallback(() => {
    cancelledRef.current = false; // Reset cancellation state
    setSelectedFiles([]);
  }, []);

  const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0 || !todoId) return [];

    cancelledRef.current = false; // Reset cancellation state
    
    // Return a promise that can be cancelled
    return new Promise((resolve, reject) => {
      const uploadController = { cancelled: false };
      
      // Store the controller so it can be cancelled
      cancelledRef.current = uploadController;
    
      // Fixed 15-second upload animation for testing purposes
      const estimateUploadSpeed = (fileSize) => {
        // Always return 15 seconds (15000ms) for testing
        return 15000; // Fixed 15 seconds for testing
      };

      const uploadPromises = selectedFiles
        .filter(fileData => fileData.status === 'pending')
        .map(async (fileData) => {
        try {
          // Start upload animation
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'uploading', progress: 0 } : f
          ));

          // Simulate upload progress over exactly 15 seconds for testing
          const estimatedTime = estimateUploadSpeed(fileData.file.size); // Always 15000ms
          const progressInterval = setInterval(() => {
            if (uploadController.cancelled) {
              clearInterval(progressInterval);
              return;
            }
            setSelectedFiles(prev => prev.map(f => {
              if (f.id === fileData.id && f.status === 'uploading') {
                // Smooth progress over 15 seconds: 90% in 15 seconds = 6% per second
                const newProgress = Math.min(f.progress + 0.6, 90); // 0.6% per 100ms = 6% per second
                return { ...f, progress: newProgress };
              }
              return f;
            }));
          }, 100); // Update every 100ms for smooth animation

          // Wait for the full 15-second animation to complete
          await new Promise(resolve => setTimeout(resolve, estimatedTime));

          // Check if upload was cancelled during animation
          if (uploadController.cancelled) {
            clearInterval(progressInterval);
            throw new Error('Upload cancelled');
          }

          // Now start the actual upload (only after animation completes)
          const formData = new FormData();
          formData.append('file', fileData.file);

          const token = localStorage.getItem('token');
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
          
          // Clear the progress interval and start actual upload
          clearInterval(progressInterval);
          const response = await fetch(`${apiUrl}/files/upload/${todoId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          
          // Complete the progress animation
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'success', progress: 100 } : f
          ));
          
          return result.attachment;
        } catch (error) {
          // Mark as error
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'error', error: error.message } : f
          ));
          throw error;
        }
        });

      Promise.all(uploadPromises)
        .then(attachments => {
          resolve(attachments);
        })
        .catch(error => {
          reject(error);
        });
    });
  }, [selectedFiles, todoId]);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
    e.target.value = null; // Clear input
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Drag & drop files here
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or</p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Browse Files
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <p className="text-xs text-gray-400 mt-2">
          Max {maxFiles} file{maxFiles > 1 ? 's' : ''}, 10MB each
        </p>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Selected Files ({selectedFiles.length}):
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((fileData) => (
              <div
                key={fileData.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getFileIcon(fileData.file)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {fileData.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileData.size)}
                    </p>
                    {fileData.error && (
                      <p className="text-xs text-red-500">{fileData.error}</p>
                    )}
                    {fileData.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-end text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>{Math.round(fileData.progress || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${fileData.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {fileData.status === 'success' && (
                      <p className="text-xs text-green-500 mt-1">✓ Uploaded successfully</p>
                    )}
                    {fileData.status === 'cancelled' && (
                      <p className="text-xs text-gray-500 mt-1">✗ Upload cancelled</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (fileData.status === 'uploading') {
                      // Cancel the upload for this specific file
                      cancelUploads();
                    } else {
                      // Remove the file from the list
                      removeFile(fileData.id);
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Current Attachments ({existingAttachments.length}):
          </h4>
          <div className="space-y-2">
            {existingAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center space-x-3">
                  {attachment.file_type === 'image' ? (
                    <Image className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {attachment.original_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Uploaded
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      showConfirm({
                        title: 'Delete File',
                        message: `Are you sure you want to delete "${attachment.original_name}"? This action cannot be undone.`,
                        confirmText: 'Delete',
                        cancelText: 'Cancel',
                        variant: 'destructive',
                        onConfirm: async () => {
                          if (onDelete) {
                            await onDelete(attachment.id);
                          }
                        }
                      });
                    }}
                    disabled={deletingFiles.has(attachment.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={deletingFiles.has(attachment.id) ? "Deleting..." : "Delete file"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
      />
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;
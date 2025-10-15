// File attachment display component for v0.6
import React, { useState } from 'react';
import { 
  File, 
  Image, 
  FileText, 
  Download, 
  X, 
  FileVideo,
  FileAudio,
  Archive
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import useConfirmDialog from '../../hooks/useConfirmDialog';

const FileAttachment = ({ 
  attachment, 
  onDelete, 
  showActions = true, 
  size = 'default',
  className = '',
  isDeleting = false
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const { dialogState, showConfirm, handleConfirm, handleCancel } = useConfirmDialog();

  const getFileIcon = () => {
    const { mime_type, file_type } = attachment;
    
    if (file_type === 'image') {
      return <Image className="w-4 h-4 text-blue-500" />;
    } else if (mime_type.includes('pdf')) {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (mime_type.includes('video')) {
      return <FileVideo className="w-4 h-4 text-purple-500" />;
    } else if (mime_type.includes('audio')) {
      return <FileAudio className="w-4 h-4 text-green-500" />;
    } else if (mime_type.includes('zip') || mime_type.includes('rar')) {
      return <Archive className="w-4 h-4 text-orange-500" />;
    } else {
      return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/files/download/${attachment.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Delete File',
      message: `Are you sure you want to delete "${attachment.original_name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          setLoading(true);
          if (onDelete) {
            await onDelete(attachment.id);
          }
        } catch (error) {
          console.error('Delete error:', error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePreview = async () => {
    if (attachment.file_type === 'image') {
      setShowPreview(true);
    } else {
      // For non-image files, download and open in new tab
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
        const response = await fetch(`${apiUrl}/files/download/${attachment.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Preview failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } catch (error) {
        console.error('Preview error:', error);
        alert('Failed to preview file. Please try downloading it instead.');
      } finally {
        setLoading(false);
      }
    }
  };

  const sizeClasses = {
    small: 'p-2',
    default: 'p-3',
    large: 'p-4'
  };

  return (
    <>
      <div className={`
        flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg animated-border
        ${sizeClasses[size]}
        ${className}
      `}>
        <div 
          className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer rounded-lg p-1 -m-1"
          onClick={(e) => {
            e.stopPropagation();
            handlePreview();
          }}
          title="Click to preview"
        >
          {attachment.thumbnail_path && attachment.file_type === 'image' ? (
            <img
              src={`/uploads/${attachment.thumbnail_path}`}
              alt={attachment.original_name}
              className="w-8 h-8 object-cover rounded"
            />
          ) : (
            getFileIcon()
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {attachment.original_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(attachment.file_size)}
            </p>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-green-500 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={loading || isDeleting}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isDeleting ? "Deleting..." : "Delete"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {showPreview && attachment.file_type === 'image' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(false);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-4xl max-h-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {attachment.original_name}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <img
              src={`/uploads/${attachment.file_path}`}
              alt={attachment.original_name}
              className="max-w-full max-h-full object-contain"
            />
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
    </>
  );
};

export default FileAttachment;

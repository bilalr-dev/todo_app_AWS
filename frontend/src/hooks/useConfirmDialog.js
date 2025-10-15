import { useState, useCallback } from 'react';

const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'destructive',
    onConfirm: null,
    onCancel: null
  });

  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'destructive',
    onConfirm,
    onCancel
  }) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm: onConfirm || (() => {}),
      onCancel: onCancel || (() => {})
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    hideConfirm();
  }, [dialogState.onConfirm, hideConfirm]);

  const handleCancel = useCallback(() => {
    if (dialogState.onCancel) {
      dialogState.onCancel();
    }
    hideConfirm();
  }, [dialogState.onCancel, hideConfirm]);

  return {
    dialogState,
    showConfirm,
    hideConfirm,
    handleConfirm,
    handleCancel
  };
};

export default useConfirmDialog;

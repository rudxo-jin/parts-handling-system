import { useState, useCallback } from 'react';

export interface ConfirmDialogConfig {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  persistent?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface ConfirmDialogState extends ConfirmDialogConfig {
  open: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState<ConfirmDialogState>({
    open: false,
    message: '',
  });

  // 다이얼로그 열기
  const openDialog = useCallback((config: ConfirmDialogConfig): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        ...config,
        open: true,
        confirmText: config.confirmText || '확인',
        cancelText: config.cancelText || '취소',
        type: config.type || 'info',
        maxWidth: config.maxWidth || 'sm',
        onConfirm: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialog(prev => ({ ...prev, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  // 다이얼로그 닫기
  const closeDialog = useCallback(() => {
    setDialog(prev => ({ ...prev, open: false }));
  }, []);

  // 편의 메서드들
  const confirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return openDialog({
      message,
      title: title || '확인',
      type: 'info',
    });
  }, [openDialog]);

  const warning = useCallback((message: string, title?: string): Promise<boolean> => {
    return openDialog({
      message,
      title: title || '경고',
      type: 'warning',
    });
  }, [openDialog]);

  const error = useCallback((message: string, title?: string): Promise<boolean> => {
    return openDialog({
      message,
      title: title || '오류',
      type: 'error',
    });
  }, [openDialog]);

  const deleteConfirm = useCallback((itemName?: string): Promise<boolean> => {
    const message = itemName 
      ? `'${itemName}'을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      : '이 항목을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.';
    
    return openDialog({
      message,
      title: '삭제 확인',
      type: 'error',
      confirmText: '삭제',
      cancelText: '취소',
    });
  }, [openDialog]);

  const saveConfirm = useCallback((hasChanges: boolean = true): Promise<boolean> => {
    if (!hasChanges) {
      return Promise.resolve(true);
    }

    return openDialog({
      message: '변경사항을 저장하시겠습니까?',
      title: '저장 확인',
      type: 'info',
      confirmText: '저장',
      cancelText: '취소',
    });
  }, [openDialog]);

  const discardChanges = useCallback((): Promise<boolean> => {
    return openDialog({
      message: '변경사항이 저장되지 않았습니다.\n정말로 취소하시겠습니까?',
      title: '변경사항 취소',
      type: 'warning',
      confirmText: '취소',
      cancelText: '계속 편집',
    });
  }, [openDialog]);

  // 복잡한 액션을 위한 고급 다이얼로그
  const actionConfirm = useCallback((
    action: string,
    details?: string,
    type: ConfirmDialogConfig['type'] = 'info'
  ): Promise<boolean> => {
    const message = details 
      ? `${action}\n\n${details}`
      : action;

    return openDialog({
      message,
      title: '작업 확인',
      type,
      confirmText: '실행',
      cancelText: '취소',
    });
  }, [openDialog]);

  return {
    // 상태
    dialog,
    
    // 기본 메서드
    openDialog,
    closeDialog,
    
    // 편의 메서드
    confirm,
    warning,
    error,
    deleteConfirm,
    saveConfirm,
    discardChanges,
    actionConfirm,
  };
}; 
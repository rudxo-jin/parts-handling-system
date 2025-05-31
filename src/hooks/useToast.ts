import { useState, useCallback, useRef, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean; // 사용자가 수동으로 닫아야 함
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // cleanup
  useEffect(() => {
    return () => {
      // 모든 타이머 정리
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  // 토스트 제거
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    
    // 타이머 정리
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // 토스트 추가
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      duration: 5000, // 기본 5초
      ...toast,
    };

    setToasts(prev => {
      // 최대 5개까지만 표시
      const filtered = prev.slice(-4);
      return [...filtered, newToast];
    });

    // 자동 제거 타이머 (persistent가 아닌 경우)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
      
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [removeToast]);

  // 편의 메서드들
  const success = useCallback((message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      type: 'success',
      message,
      title: '성공',
      duration: 3000,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      type: 'error',
      message,
      title: '오류',
      duration: 6000,
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      type: 'warning',
      message,
      title: '경고',
      duration: 4000,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<ToastMessage>) => {
    return addToast({
      type: 'info',
      message,
      title: '알림',
      duration: 4000,
      ...options,
    });
  }, [addToast]);

  // 모든 토스트 제거
  const clearAll = useCallback(() => {
    setToasts([]);
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  // 특정 타입의 토스트들 제거
  const clearByType = useCallback((type: ToastMessage['type']) => {
    setToasts(prev => {
      const toRemove = prev.filter(toast => toast.type === type);
      const toKeep = prev.filter(toast => toast.type !== type);
      
      // 제거할 토스트들의 타이머 정리
      toRemove.forEach(toast => {
        const timeout = timeoutsRef.current.get(toast.id);
        if (timeout) {
          clearTimeout(timeout);
          timeoutsRef.current.delete(toast.id);
        }
      });
      
      return toKeep;
    });
  }, []);

  // 액션 실행 후 토스트 제거
  const executeAction = useCallback((toastId: string, action: () => void) => {
    try {
      action();
      removeToast(toastId);
    } catch (error) {
      console.error('토스트 액션 실행 오류:', error);
    }
  }, [removeToast]);

  // 로딩 상태와 연동된 토스트
  const promiseToast = useCallback(async <T>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    }
  ): Promise<T> => {
    let loadingToastId: string | null = null;

    try {
      // 로딩 토스트 표시
      if (messages.loading) {
        loadingToastId = addToast({
          type: 'info',
          message: messages.loading,
          persistent: true,
        });
      }

      const result = await promise;

      // 로딩 토스트 제거
      if (loadingToastId) {
        removeToast(loadingToastId);
      }

      // 성공 토스트 표시
      if (messages.success) {
        success(messages.success);
      }

      return result;
    } catch (err) {
      // 로딩 토스트 제거
      if (loadingToastId) {
        removeToast(loadingToastId);
      }

      // 오류 토스트 표시
      const errorMessage = messages.error || '작업 중 오류가 발생했습니다.';
      error(errorMessage);

      throw err;
    }
  }, [addToast, removeToast, success, error]);

  return {
    // 상태
    toasts,
    
    // 기본 메서드
    addToast,
    removeToast,
    
    // 편의 메서드
    success,
    error,
    warning,
    info,
    
    // 관리 메서드
    clearAll,
    clearByType,
    executeAction,
    
    // 고급 기능
    promiseToast,
  };
}; 
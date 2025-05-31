import { useState, useCallback, useEffect, useRef } from 'react';

export interface ErrorInfo {
  id: string;
  type: 'network' | 'validation' | 'permission' | 'system' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: string;
  userAction?: string;
  retryable: boolean;
  autoRetryCount: number;
  maxRetries: number;
}

interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isRetrying, setIsRetrying] = useState<Record<string, boolean>>({});
  
  // cleanup을 위한 ref
  const mountedRef = useRef(true);

  // 에러 분류 및 메시지 생성
  const classifyError = useCallback((error: Error | string, context?: string): Omit<ErrorInfo, 'id' | 'timestamp'> => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const originalError = typeof error === 'string' ? undefined : error;

    // 네트워크 에러
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        type: 'network',
        severity: 'medium',
        message: '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.',
        originalError,
        context,
        retryable: true,
        autoRetryCount: 0,
        maxRetries: 3,
      };
    }

    // Firebase 권한 에러
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return {
        type: 'permission',
        severity: 'high',
        message: '접근 권한이 없습니다. 관리자에게 문의하거나 다시 로그인해주세요.',
        originalError,
        context,
        retryable: false,
        autoRetryCount: 0,
        maxRetries: 0,
      };
    }

    // 유효성 검사 에러
    if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
      return {
        type: 'validation',
        severity: 'low',
        message: '입력한 정보를 다시 확인해주세요.',
        originalError,
        context,
        retryable: false,
        autoRetryCount: 0,
        maxRetries: 0,
      };
    }

    // Firebase 에러
    if (errorMessage.includes('firebase') || errorMessage.includes('firestore')) {
      return {
        type: 'system',
        severity: 'high',
        message: '시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        originalError,
        context,
        retryable: true,
        autoRetryCount: 0,
        maxRetries: 2,
      };
    }

    // 기본 에러
    return {
      type: 'unknown',
      severity: 'medium',
      message: '예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해주세요.',
      originalError,
      context,
      retryable: true,
      autoRetryCount: 0,
      maxRetries: 1,
    };
  }, []);

  // 에러 추가
  const addError = useCallback((error: Error | string, context?: string, userAction?: string) => {
    if (!mountedRef.current) return '';
    
    try {
      const errorInfo: ErrorInfo = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userAction,
        ...classifyError(error, context),
      };

      setErrors(prev => [errorInfo, ...prev.slice(0, 9)]); // 최대 10개 에러 유지

      // 콘솔에 상세 로그
      console.group(`🚨 에러 발생: ${errorInfo.type} (${errorInfo.severity})`);
      console.log('메시지:', errorInfo.message);
      console.log('컨텍스트:', context);
      console.log('사용자 액션:', userAction);
      console.log('원본 에러:', errorInfo.originalError);
      console.log('시간:', errorInfo.timestamp);
      console.groupEnd();

      return errorInfo.id;
    } catch (err) {
      console.error('에러 추가 실패:', err);
      return '';
    }
  }, [classifyError]);

  // 자동 재시도
  const autoRetry = useCallback(async (errorId: string, retryFunction: () => Promise<any>) => {
    if (!mountedRef.current) return false;
    
    const error = errors.find(e => e.id === errorId);
    if (!error || !error.retryable || error.autoRetryCount >= error.maxRetries) {
      return false;
    }

    setIsRetrying(prev => ({ ...prev, [errorId]: true }));

    try {
      // 재시도 지연 (지수 백오프)
      const delay = Math.min(1000 * Math.pow(2, error.autoRetryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));

      if (!mountedRef.current) return false;

      await retryFunction();

      // 성공 시 에러 제거
      removeError(errorId);
      console.log(`✅ 자동 재시도 성공: ${error.context}`);
      return true;
    } catch (retryError) {
      if (!mountedRef.current) return false;
      
      // 재시도 횟수 증가
      setErrors(prev => prev.map(e => 
        e.id === errorId 
          ? { ...e, autoRetryCount: e.autoRetryCount + 1 }
          : e
      ));

      console.log(`❌ 자동 재시도 실패 (${error.autoRetryCount + 1}/${error.maxRetries}): ${error.context}`);
      return false;
    } finally {
      if (mountedRef.current) {
        setIsRetrying(prev => {
          const { [errorId]: removed, ...rest } = prev;
          return rest;
        });
      }
    }
  }, [errors]);

  // 에러 제거
  const removeError = useCallback((errorId: string) => {
    if (!mountedRef.current) return;
    
    setErrors(prev => prev.filter(e => e.id !== errorId));
    setIsRetrying(prev => {
      const { [errorId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // 모든 에러 제거
  const clearAllErrors = useCallback(() => {
    if (!mountedRef.current) return;
    
    setErrors([]);
    setIsRetrying({});
  }, []);

  // 에러 복구 액션 생성
  const getRecoveryActions = useCallback((error: ErrorInfo): ErrorRecoveryAction[] => {
    const actions: ErrorRecoveryAction[] = [];

    // 기본 닫기 액션
    actions.push({
      label: '확인',
      action: () => removeError(error.id),
    });

    // 재시도 액션 (재시도 가능한 경우)
    if (error.retryable && error.autoRetryCount < error.maxRetries) {
      actions.unshift({
        label: '다시 시도',
        action: async () => {
          // 재시도 로직은 호출하는 곳에서 구현
          console.log(`🔄 수동 재시도: ${error.context}`);
        },
        primary: true,
      });
    }

    // 권한 에러의 경우 로그인 액션
    if (error.type === 'permission') {
      actions.unshift({
        label: '다시 로그인',
        action: () => {
          // 로그인 페이지로 이동 또는 로그인 모달 열기
          window.location.href = '/login';
        },
        primary: true,
      });
    }

    // 네트워크 에러의 경우 새로고침 액션
    if (error.type === 'network') {
      actions.unshift({
        label: '페이지 새로고침',
        action: () => {
          window.location.reload();
        },
      });
    }

    return actions;
  }, [removeError]);

  // 에러 통계
  const getErrorStats = useCallback(() => {
    const stats = {
      total: errors.length,
      byType: {} as Record<ErrorInfo['type'], number>,
      bySeverity: {} as Record<ErrorInfo['severity'], number>,
      retryable: errors.filter(e => e.retryable).length,
      critical: errors.filter(e => e.severity === 'critical').length,
    };

    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }, [errors]);

  // 에러 리포트 생성
  const generateErrorReport = useCallback(() => {
    return {
      timestamp: new Date(),
      errors: errors.map(error => ({
        ...error,
        originalError: error.originalError?.message,
      })),
      stats: getErrorStats(),
    };
  }, [errors, getErrorStats]);

  // 에러 래퍼 함수
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: string
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorId = addError(error as Error, context);
        
        // 자동 재시도 가능한 경우 시도
        const errorInfo = errors.find(e => e.id === errorId);
        if (errorInfo?.retryable && errorInfo.autoRetryCount < errorInfo.maxRetries) {
          const retrySuccess = await autoRetry(errorId, () => fn(...args));
          if (retrySuccess) {
            return await fn(...args);
          }
        }
        
        throw error;
      }
    };
  }, [addError, errors, autoRetry]);

  // 전역 에러 핸들러 설정
  useEffect(() => {
    mountedRef.current = true;
    
    const handleUnhandledError = (event: ErrorEvent) => {
      if (mountedRef.current) {
        addError(event.error || event.message, 'Global Error Handler', 'Unhandled Error');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (mountedRef.current) {
        addError(event.reason, 'Global Promise Rejection', 'Unhandled Promise Rejection');
      }
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addError]);

  return {
    errors,
    isRetrying,
    addError,
    removeError,
    clearAllErrors,
    autoRetry,
    getRecoveryActions,
    getErrorStats,
    generateErrorReport,
    withErrorHandling,
  };
}; 
// Firebase Timestamp 관련 유틸리티 함수들

/**
 * Firebase Timestamp를 안전하게 Date 객체로 변환합니다.
 * @param timestamp Firebase Timestamp 또는 null/undefined
 * @param fallback 변환 실패 시 사용할 기본값 (기본: 현재 시간)
 * @returns Date 객체
 */
export const safeToDate = (timestamp: any, fallback: Date = new Date()): Date => {
  if (!timestamp) {
    return fallback;
  }
  
  // Firebase Timestamp 객체인지 확인
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Failed to convert timestamp to date:', error);
      return fallback;
    }
  }
  
  // 이미 Date 객체인 경우
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // 문자열이나 숫자인 경우 Date로 변환 시도
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    try {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? fallback : date;
    } catch (error) {
      console.warn('Failed to parse date:', error);
      return fallback;
    }
  }
  
  return fallback;
};

/**
 * 날짜를 한국어 형식으로 포맷팅합니다.
 * @param date Date 객체
 * @returns 포맷된 날짜 문자열
 */
export const formatKoreanDate = (date: Date): string => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅합니다.
 * @param date Date 객체
 * @returns 포맷된 날짜시간 문자열
 */
export const formatKoreanDateTime = (date: Date): string => {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * 상대적 시간을 한국어로 표시합니다.
 * @param date Date 객체
 * @returns 상대적 시간 문자열 (예: "3분 전", "2시간 전")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return '방금 전';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return formatKoreanDate(date);
  }
}; 
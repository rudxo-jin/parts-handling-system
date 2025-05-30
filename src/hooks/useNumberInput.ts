import { useState, useCallback } from 'react';

interface UseNumberInputOptions {
  initialValue?: number;
  defaultValue?: number; // 빈 값일 때 되돌릴 기본값
  allowEmpty?: boolean; // 빈 값을 허용할지 여부
}

export const useNumberInput = (options: UseNumberInputOptions = {}) => {
  const {
    initialValue = 0,
    defaultValue = 0,
    allowEmpty = false
  } = options;

  const [value, setValue] = useState<number | string>(initialValue);

  const handleFocus = useCallback(() => {
    if (value === 0) {
      setValue('');
    }
  }, [value]);

  const handleBlur = useCallback(() => {
    if (value === '' || value === null || value === undefined || isNaN(Number(value))) {
      if (allowEmpty) {
        setValue('');
      } else {
        setValue(defaultValue);
      }
    }
  }, [value, defaultValue, allowEmpty]);

  const handleChange = useCallback((newValue: string) => {
    if (newValue === '') {
      setValue('');
    } else {
      const numValue = Number(newValue);
      if (!isNaN(numValue)) {
        setValue(numValue);
      }
    }
  }, []);

  // 실제 숫자 값 반환 (저장이나 계산용)
  const getNumberValue = useCallback(() => {
    if (typeof value === 'string') {
      return value === '' ? defaultValue : Number(value);
    }
    return value;
  }, [value, defaultValue]);

  // 초기값으로 리셋
  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue,
    handleFocus,
    handleBlur,
    handleChange,
    getNumberValue,
    reset
  };
}; 
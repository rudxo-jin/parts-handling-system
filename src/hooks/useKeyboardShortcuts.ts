import { useEffect, useCallback, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Cmd on Mac, Windows key on Windows
  action: () => void;
  description?: string;
  preventDefault?: boolean;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  target?: HTMLElement | Window;
  disabled?: boolean;
}

export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { target = window, disabled = false } = options;
  const shortcutsRef = useRef<ShortcutConfig[]>([]);

  // shortcuts를 ref에 저장 (이벤트 리스너에서 최신 값 사용)
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (disabled) return;

    // 입력 필드에서는 대부분의 단축키 비활성화
    const target = keyboardEvent.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.disabled) continue;

      // 키 매칭
      const keyMatch = keyboardEvent.key.toLowerCase() === shortcut.key.toLowerCase() ||
                      keyboardEvent.code.toLowerCase() === shortcut.key.toLowerCase();

      // 수식어 키 매칭
      const ctrlMatch = !shortcut.ctrl || keyboardEvent.ctrlKey;
      const altMatch = !shortcut.alt || keyboardEvent.altKey;
      const shiftMatch = !shortcut.shift || keyboardEvent.shiftKey;
      const metaMatch = !shortcut.meta || keyboardEvent.metaKey;

      // 정확한 수식어 키 매칭 (없어야 할 키가 눌려있으면 안됨)
      const exactCtrl = shortcut.ctrl ? keyboardEvent.ctrlKey : !keyboardEvent.ctrlKey;
      const exactAlt = shortcut.alt ? keyboardEvent.altKey : !keyboardEvent.altKey;
      const exactShift = shortcut.shift ? keyboardEvent.shiftKey : !keyboardEvent.shiftKey;
      const exactMeta = shortcut.meta ? keyboardEvent.metaKey : !keyboardEvent.metaKey;

      if (keyMatch && exactCtrl && exactAlt && exactShift && exactMeta) {
        // 입력 필드에서는 Ctrl+키 조합만 허용
        if (isInputElement && !(shortcut.ctrl || shortcut.meta)) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          keyboardEvent.preventDefault();
        }

        try {
          shortcut.action();
        } catch (error) {
          console.error('단축키 실행 오류:', error);
        }
        
        break; // 첫 번째 매칭된 단축키만 실행
      }
    }
  }, [disabled]);

  useEffect(() => {
    const element = target instanceof Window ? window : target;
    
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      
      return () => {
        element.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [target, handleKeyDown]);

  // 단축키 설명 생성
  const getShortcutDescription = useCallback((shortcut: ShortcutConfig): string => {
    const parts: string[] = [];
    
    if (shortcut.meta) parts.push('⌘'); // Mac Cmd symbol
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  }, []);

  // 모든 단축키 목록 반환
  const getShortcutList = useCallback(() => {
    return shortcuts
      .filter(s => !s.disabled && s.description)
      .map(shortcut => ({
        combo: getShortcutDescription(shortcut),
        description: shortcut.description,
      }));
  }, [shortcuts, getShortcutDescription]);

  return {
    getShortcutDescription,
    getShortcutList,
  };
};

// 일반적인 단축키들을 위한 헬퍼 함수들
export const createShortcut = (
  key: string,
  action: () => void,
  options: Partial<ShortcutConfig> = {}
): ShortcutConfig => ({
  key,
  action,
  preventDefault: true,
  ...options,
});

export const createCtrlShortcut = (
  key: string,
  action: () => void,
  description?: string
): ShortcutConfig => ({
  key,
  ctrl: true,
  action,
  description,
  preventDefault: true,
});

export const createAltShortcut = (
  key: string,
  action: () => void,
  description?: string
): ShortcutConfig => ({
  key,
  alt: true,
  action,
  description,
  preventDefault: true,
});

// 공통 단축키 정의
export const commonShortcuts = {
  save: (action: () => void) => createCtrlShortcut('s', action, '저장'),
  refresh: (action: () => void) => createShortcut('F5', action, { description: '새로고침' }),
  escape: (action: () => void) => createShortcut('Escape', action, { description: '취소/닫기' }),
  enter: (action: () => void) => createShortcut('Enter', action, { description: '확인/실행' }),
  delete: (action: () => void) => createShortcut('Delete', action, { description: '삭제' }),
  copy: (action: () => void) => createCtrlShortcut('c', action, '복사'),
  paste: (action: () => void) => createCtrlShortcut('v', action, '붙여넣기'),
  selectAll: (action: () => void) => createCtrlShortcut('a', action, '모두 선택'),
  undo: (action: () => void) => createCtrlShortcut('z', action, '실행 취소'),
  redo: (action: () => void) => createCtrlShortcut('y', action, '다시 실행'),
  find: (action: () => void) => createCtrlShortcut('f', action, '찾기'),
  newItem: (action: () => void) => createCtrlShortcut('n', action, '새 항목'),
}; 
import type { MemoryOperation } from '../memory';
import type { AngleMode, NotationMode } from '../storage';

export type CoreKeyboardValue =
  | 'clear'
  | 'divide'
  | 'multiply'
  | 'subtract'
  | 'add'
  | 'equals'
  | 'decimal'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

export type ScientificKeyboardValue =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'log'
  | 'ln'
  | 'pow2'
  | 'pow10'
  | 'pow'
  | 'exp'
  | 'sqrt'
  | 'cbrt'
  | 'root';

export type KeyboardInputAction =
  | {
      type: 'core';
      value: CoreKeyboardValue;
    }
  | {
      type: 'scientific';
      value: ScientificKeyboardValue;
    }
  | {
      type: 'memory';
      operation: MemoryOperation;
    }
  | {
      type: 'angle-mode';
      value: AngleMode;
    }
  | {
      type: 'notation-mode';
      value: NotationMode;
    }
  | {
      type: 'toggle-angle-mode';
    }
  | {
      type: 'toggle-notation-mode';
    };

export interface KeyboardInputEventLike {
  altKey: boolean;
  code: string;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
  target: EventTarget | null;
}

export function resolveKeyboardInputAction(
  event: KeyboardInputEventLike,
): KeyboardInputAction | null {
  if (isEditableKeyboardTarget(event.target) || event.ctrlKey || event.metaKey) {
    return null;
  }

  if (event.altKey) {
    return resolveModifiedShortcut(event);
  }

  const key = event.key;
  const normalizedKey = key.toLowerCase();

  if (/^[0-9]$/.test(key)) {
    return {
      type: 'core',
      value: key as CoreKeyboardValue,
    };
  }

  if (event.code.startsWith('Numpad') && /^[0-9]$/.test(key)) {
    return {
      type: 'core',
      value: key as CoreKeyboardValue,
    };
  }

  const coreAction = resolveCoreAction(key, event.code);

  if (coreAction) {
    return coreAction;
  }

  return resolveScientificShortcut(normalizedKey, event.shiftKey);
}

function resolveModifiedShortcut(event: KeyboardInputEventLike): KeyboardInputAction | null {
  const key = event.key.toLowerCase();

  if (key === 'd') {
    return { type: 'angle-mode', value: 'deg' };
  }

  if (key === 'r') {
    return { type: 'angle-mode', value: 'rad' };
  }

  if (key === 'a') {
    return { type: 'toggle-angle-mode' };
  }

  if (key === 's') {
    return { type: 'notation-mode', value: 'standard' };
  }

  if (key === 'n') {
    return { type: 'notation-mode', value: 'scientific' };
  }

  if (key === 'f') {
    return { type: 'toggle-notation-mode' };
  }

  if (key === '+' || key === '=') {
    return { type: 'memory', operation: 'M+' };
  }

  if (key === '-') {
    return { type: 'memory', operation: 'M-' };
  }

  if (key === 'm') {
    return { type: 'memory', operation: 'MR' };
  }

  if (key === 'c') {
    return { type: 'memory', operation: 'MC' };
  }

  return null;
}

function resolveCoreAction(key: string, code: string): KeyboardInputAction | null {
  if (key === '.' || key === ',' || code === 'NumpadDecimal') {
    return { type: 'core', value: 'decimal' };
  }

  if (key === '+' || code === 'NumpadAdd') {
    return { type: 'core', value: 'add' };
  }

  if (key === '-' || code === 'NumpadSubtract') {
    return { type: 'core', value: 'subtract' };
  }

  if (key === '*' || key.toLowerCase() === 'x' || code === 'NumpadMultiply') {
    return { type: 'core', value: 'multiply' };
  }

  if (key === '/' || code === 'NumpadDivide') {
    return { type: 'core', value: 'divide' };
  }

  if (key === '=' || key === 'Enter' || code === 'NumpadEnter') {
    return { type: 'core', value: 'equals' };
  }

  if (key === 'Escape' || key === 'Delete' || key === 'Backspace') {
    return { type: 'core', value: 'clear' };
  }

  return null;
}

function resolveScientificShortcut(key: string, shiftKey: boolean): KeyboardInputAction | null {
  if (key === 's') {
    return { type: 'scientific', value: shiftKey ? 'asin' : 'sin' };
  }

  if (key === 'c') {
    return { type: 'scientific', value: shiftKey ? 'acos' : 'cos' };
  }

  if (key === 't') {
    return { type: 'scientific', value: shiftKey ? 'atan' : 'tan' };
  }

  if (key === 'l') {
    return { type: 'scientific', value: 'log' };
  }

  if (key === 'n') {
    return { type: 'scientific', value: 'ln' };
  }

  if (key === 'p' || key === '^') {
    return { type: 'scientific', value: 'pow' };
  }

  if (key === '@') {
    return { type: 'scientific', value: 'pow2' };
  }

  if (key === '#') {
    return { type: 'scientific', value: 'pow10' };
  }

  if (key === 'e') {
    return { type: 'scientific', value: 'exp' };
  }

  if (key === 'q') {
    return { type: 'scientific', value: 'sqrt' };
  }

  if (key === 'b') {
    return { type: 'scientific', value: 'cbrt' };
  }

  if (key === 'r') {
    return { type: 'scientific', value: 'root' };
  }

  return null;
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const elementLike = target as {
    getAttribute?: (name: string) => string | null;
    isContentEditable?: boolean;
    tagName?: string;
  };

  if (elementLike.isContentEditable) {
    return true;
  }

  const tagName = elementLike.tagName?.toLowerCase();

  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  return elementLike.getAttribute?.('role') === 'textbox';
}

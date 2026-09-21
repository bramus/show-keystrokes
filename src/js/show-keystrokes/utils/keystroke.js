/**
 * Keystroke parsing, normalization, classification, and platform formatting utilities
 * for the <show-keystrokes> custom element.
 */

export const DEFAULT_FILTERS = ['shortcuts', 'navigation'];
export const DEFAULT_TIMEOUT = 1500;
export const DEFAULT_FADE_DURATION = 300;
export const DEFAULT_SIZE = 'large';

export const VALID_SIZES = new Set(['small', 'medium', 'large', 'x-large', 'xx-large']);
export const VALID_VERTICAL_POSITIONS = new Set(['top', 'center', 'bottom']);
export const VALID_HORIZONTAL_POSITIONS = new Set(['left', 'center', 'right']);
export const VALID_POINTER_KEYWORDS = new Set(['pointer', 'mouse']);

export const MODIFIER_EVENT_KEYS = new Set([
  'Meta',
  'Control',
  'Shift',
  'Alt',
  'AltGraph',
  'OS',
  'Super',
  'Hyper',
]);

export const NAVIGATION_EVENT_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Up',
  'Down',
  'Left',
  'Right',
  'Tab',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Enter',
  'Escape',
  'Esc',
  'Backspace',
  'Delete',
  'Del',
  ' ',
  '\u00A0',
  'Space',
  'Spacebar',
]);

export const SPECIAL_ACTION_EVENT_KEYS = new Set([
  ...NAVIGATION_EVENT_KEYS,
  'Insert',
  'CapsLock',
  'ContextMenu',
  'PrintScreen',
  'ScrollLock',
  'Pause',
]);

const KEY_LABELS_TEXT = {
  ArrowRight: '→',
  Right: '→',
  ArrowLeft: '←',
  Left: '←',
  ArrowUp: '↑',
  Up: '↑',
  ArrowDown: '↓',
  Down: '↓',
  Tab: 'TAB',
  Enter: 'ENTER',
  Escape: 'ESC',
  Esc: 'ESC',
  ' ': 'SPACE',
  '\u00A0': 'SPACE',
  Space: 'SPACE',
  Spacebar: 'SPACE',
  Backspace: 'BACKSPACE',
  Delete: 'DELETE',
  Del: 'DELETE',
  Home: 'HOME',
  End: 'END',
  PageUp: 'PAGE UP',
  PageDown: 'PAGE DOWN',
  CapsLock: 'CAPS LOCK',
  Insert: 'INSERT',
  ContextMenu: 'MENU',
};

const KEY_LABELS_SYMBOLS = {
  ...KEY_LABELS_TEXT,
  Tab: '⇥',
  Enter: '↵',
  Escape: '⎋',
  Esc: '⎋',
  ' ': 'SPACE',
  '\u00A0': 'SPACE',
  Space: 'SPACE',
  Spacebar: 'SPACE',
  Backspace: '⌫',
  Delete: '⌦',
  Del: '⌦',
  Home: '↖',
  End: '↘',
  PageUp: '⇞',
  PageDown: '⇟',
  CapsLock: '⇪',
};

export const ALL_MODIFIER_LABELS = new Set([
  'CMD',
  'COMMAND',
  'META',
  '⌘',
  'CTRL',
  'CONTROL',
  '⌃',
  'SHIFT',
  '⇧',
  'ALT',
  'OPT',
  'OPTION',
  '⌥',
  'WIN',
  'WINDOWS',
  'SUPER',
  '⊞',
]);

/**
 * Detects whether the current environment or explicit override is 'mac' or 'windows'.
 *
 * @param {string} [overridePlatform='auto'] - 'auto', 'mac', 'macos', 'windows', 'win'
 * @param {object} [nav] - Optional navigator-like object for testing
 * @returns {'mac' | 'windows'}
 */
export function detectPlatform(overridePlatform = 'auto', nav = typeof navigator !== 'undefined' ? navigator : null) {
  const normalized = String(overridePlatform || 'auto').trim().toLowerCase();
  if (normalized === 'mac' || normalized === 'macos' || normalized === 'darwin' || normalized === 'apple' || normalized === 'ios') {
    return 'mac';
  }
  if (normalized === 'windows' || normalized === 'win' || normalized === 'win32' || normalized === 'pc' || normalized === 'linux') {
    return 'windows';
  }

  if (nav) {
    const platformString = [
      nav.userAgentData?.platform,
      nav.platform,
      nav.userAgent,
    ]
      .filter(Boolean)
      .join(' ');

    if (/mac|iphone|ipad|ipod/i.test(platformString)) {
      return 'mac';
    }
  }

  return 'windows';
}

/**
 * Parses a filter string (or boolean flags) into a normalized Set of active filter categories:
 * 'all', 'shortcuts', 'navigation'.
 *
 * @param {string | null | undefined} filterAttr
 * @param {{ all?: boolean, shortcuts?: boolean, navigation?: boolean }} [booleanFlags={}]
 * @returns {Set<'all' | 'shortcuts' | 'navigation'>}
 */
export function parseFilters(filterAttr, booleanFlags = {}) {
  const result = new Set();

  if (typeof filterAttr === 'string' && filterAttr.trim().length > 0) {
    const tokens = filterAttr
      .toLowerCase()
      .split(/[\s,|+/]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    for (const token of tokens) {
      if (token === 'all' || token === '*' || token === 'any' || token === 'keystrokes') {
        result.add('all');
        result.add('shortcuts');
        result.add('navigation');
      } else if (token === 'shortcut' || token === 'shortcuts' || token === 'hotkeys' || token === 'combos') {
        result.add('shortcuts');
      } else if (
        token === 'navigation' ||
        token === 'navigational' ||
        token === 'nav' ||
        token === 'arrows'
      ) {
        result.add('navigation');
      } else if (token === 'none' || token === 'off') {
        return new Set();
      }
    }
  } else {
    if (booleanFlags.all) {
      result.add('all');
      result.add('shortcuts');
      result.add('navigation');
    }
    if (booleanFlags.shortcuts) {
      result.add('shortcuts');
    }
    if (booleanFlags.navigation) {
      result.add('navigation');
    }
  }

  if (result.size === 0) {
    return new Set(DEFAULT_FILTERS);
  }

  return result;
}

/**
 * Checks whether a KeyboardEvent key is a modifier key itself.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isModifierKey(key) {
  return MODIFIER_EVENT_KEYS.has(key);
}

/**
 * Checks whether a KeyboardEvent key is a function key (F1 - F24).
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isFunctionKey(key) {
  return /^F([1-9]|1[0-9]|2[0-4])$/i.test(String(key || ''));
}

/**
 * Normalizes a primary key from a KeyboardEvent into a display label
 * such as '→', 'TAB', 'ENTER', 'A', '1', etc.
 *
 * @param {KeyboardEvent | { key?: string, code?: string, altKey?: boolean, metaKey?: boolean, ctrlKey?: boolean }} event
 * @param {{ notation?: 'text' | 'symbols' }} [options={}]
 * @returns {string}
 */
export function normalizeKeyLabel(event, options = {}) {
  const notation = options.notation === 'symbols' ? 'symbols' : 'text';
  const labelMap = notation === 'symbols' ? KEY_LABELS_SYMBOLS : KEY_LABELS_TEXT;

  const rawKey = String(event?.key ?? '');
  const rawCode = String(event?.code ?? '');

  // Always label any Space press as 'SPACE' (never an empty/whitespace box)
  if (
    rawCode === 'Space' ||
    rawKey === ' ' ||
    rawKey === '\u00A0' ||
    rawKey === 'Space' ||
    rawKey === 'Spacebar' ||
    (rawKey.length > 0 && rawKey.trim() === '')
  ) {
    return 'SPACE';
  }

  if (Object.prototype.hasOwnProperty.call(labelMap, rawKey)) {
    return labelMap[rawKey];
  }

  if (Object.prototype.hasOwnProperty.call(labelMap, rawCode)) {
    return labelMap[rawCode];
  }

  if (isFunctionKey(rawKey)) {
    return rawKey.toUpperCase();
  }

  if (isFunctionKey(rawCode)) {
    return rawCode.toUpperCase();
  }

  // On macOS, holding Option (altKey) or Shift+Cmd with letters/digits can produce dead keys
  // or alternate symbols in event.key (e.g. Option+T -> '†'). Recover the physical key from event.code.
  if (rawCode) {
    if (/^Key[A-Z]$/.test(rawCode)) {
      return rawCode.slice(3).toUpperCase();
    }
    if (/^Digit[0-9]$/.test(rawCode) && (event?.metaKey || event?.ctrlKey || event?.altKey)) {
      return rawCode.slice(5);
    }
  }

  if (rawKey.length === 1) {
    return rawKey.toUpperCase();
  }

  if (!rawKey || rawKey === 'Unidentified' || rawKey === 'Dead') {
    if (/^Key[A-Z]$/.test(rawCode)) {
      return rawCode.slice(3).toUpperCase();
    }
    if (/^Digit[0-9]$/.test(rawCode)) {
      return rawCode.slice(5);
    }
    return '';
  }

  return rawKey.toUpperCase();
}

/**
 * Extracts ordered modifier labels from a KeyboardEvent according to platform conventions.
 *
 * Ordering:
 * - macOS:   CTRL -> ALT -> SHIFT -> CMD   (e.g. `SHIFT + CMD + T`, `CMD + A`, `SHIFT + TAB`)
 * - Windows: WIN  -> ALT -> SHIFT -> CTRL  (e.g. `SHIFT + CTRL + T`, `CTRL + A`, `SHIFT + TAB`)
 *
 * @param {KeyboardEvent | { ctrlKey?: boolean, altKey?: boolean, shiftKey?: boolean, metaKey?: boolean, key?: string }} event
 * @param {{ platform?: 'mac' | 'windows', notation?: 'text' | 'symbols', mapMetaToCtrlOnWindows?: boolean }} [options={}]
 * @returns {string[]}
 */
export function getModifierLabels(event, options = {}) {
  const platform = options.platform || 'mac';
  const notation = options.notation === 'symbols' ? 'symbols' : 'text';
  const mapMetaToCtrlOnWindows = Boolean(options.mapMetaToCtrlOnWindows);

  const ctrl = Boolean(event?.ctrlKey) || (platform === 'windows' && mapMetaToCtrlOnWindows && Boolean(event?.metaKey));
  const alt = Boolean(event?.altKey);
  const shift = Boolean(event?.shiftKey);
  const meta = platform === 'windows' && mapMetaToCtrlOnWindows ? false : Boolean(event?.metaKey);

  const modifiers = [];

  if (platform === 'mac') {
    if (ctrl) modifiers.push(notation === 'symbols' ? '⌃' : 'CTRL');
    if (alt) modifiers.push(notation === 'symbols' ? '⌥' : 'ALT');
    if (shift) modifiers.push(notation === 'symbols' ? '⇧' : 'SHIFT');
    if (meta) modifiers.push(notation === 'symbols' ? '⌘' : 'CMD');
  } else {
    if (meta) modifiers.push(notation === 'symbols' ? '⊞' : 'WIN');
    if (alt) modifiers.push('ALT');
    if (shift) modifiers.push(notation === 'symbols' ? '⇧' : 'SHIFT');
    if (ctrl) modifiers.push('CTRL');
  }

  return modifiers;
}

/**
 * Classifies a KeyboardEvent into its categories (`isShortcut`, `isNavigation`, `isModifierOnly`)
 * and determines whether it should be displayed under the given filter Set.
 *
 * @param {KeyboardEvent | object} event
 * @param {{
 *   filters?: Set<string>,
 *   platform?: 'mac' | 'windows',
 *   notation?: 'text' | 'symbols',
 *   mapMetaToCtrlOnWindows?: boolean
 * }} [options={}]
 * @returns {{
 *   shouldShow: boolean,
 *   category: 'shortcut' | 'navigation' | 'keystroke' | 'modifier' | 'ignored',
 *   isShortcut: boolean,
 *   isNavigation: boolean,
 *   isModifierOnly: boolean,
 *   modifiers: string[],
 *   primaryKey: string,
 *   keys: Array<{ label: string, type: 'modifier' | 'primary' }>,
 *   label: string
 * }}
 */
export function formatKeystrokeEvent(event, options = {}) {
  const filters = options.filters instanceof Set ? options.filters : parseFilters(options.filters);
  const platform = detectPlatform(options.platform);
  const notation = options.notation === 'symbols' ? 'symbols' : 'text';

  const rawKey = String(event?.key ?? '');
  const rawCode = String(event?.code ?? '');
  const modifierOnly = isModifierKey(rawKey);

  if (modifierOnly) {
    return {
      shouldShow: false,
      category: 'modifier',
      isShortcut: false,
      isNavigation: false,
      isModifierOnly: true,
      modifiers: [],
      primaryKey: '',
      keys: [],
      label: '',
    };
  }

  const primaryKey = normalizeKeyLabel(event, { notation });
  if (!primaryKey) {
    return {
      shouldShow: false,
      category: 'ignored',
      isShortcut: false,
      isNavigation: false,
      isModifierOnly: false,
      modifiers: [],
      primaryKey: '',
      keys: [],
      label: '',
    };
  }

  const hasPrimaryModifier = Boolean(event?.metaKey || event?.ctrlKey || event?.altKey);
  const hasShift = Boolean(event?.shiftKey);
  const isSpace =
    rawCode === 'Space' ||
    rawKey === ' ' ||
    rawKey === '\u00A0' ||
    rawKey === 'Space' ||
    rawKey === 'Spacebar' ||
    (rawKey.length > 0 && rawKey.trim() === '');
  const isNavKey =
    isSpace ||
    NAVIGATION_EVENT_KEYS.has(rawKey) ||
    NAVIGATION_EVENT_KEYS.has(rawCode);
  const isSpecialActionKey =
    isNavKey ||
    SPECIAL_ACTION_EVENT_KEYS.has(rawKey) ||
    SPECIAL_ACTION_EVENT_KEYS.has(rawCode);
  const isFnKey = isFunctionKey(rawKey) || isFunctionKey(rawCode);

  // A keystroke is a shortcut when:
  // 1. Any primary modifier (CMD / CTRL / ALT / WIN) is held with a key (e.g. CMD+A, SHIFT+CMD+T, CTRL+C)
  // 2. SHIFT is held with a navigation/special/function key (e.g. SHIFT+TAB, SHIFT+ENTER, SHIFT+ESC)
  // 3. A function key (F1-F24) is pressed
  const isShortcut = hasPrimaryModifier || (hasShift && (isSpecialActionKey || isFnKey)) || isFnKey;

  // A keystroke is a navigational/special key when a navigation/editing/function key
  // (Arrows, TAB, BACKSPACE, DELETE, SPACE, F1-F24, HOME, END, PAGE UP/DOWN, ENTER, ESC)
  // is pressed without CMD/CTRL/ALT (or with SHIFT, e.g. →, TAB, SHIFT + TAB, BACKSPACE, SPACE, DELETE, F1-F15).
  const isNavigation = (isNavKey || isFnKey) && !hasPrimaryModifier;

  let modifiers = getModifierLabels(event, {
    platform,
    notation,
    mapMetaToCtrlOnWindows: options.mapMetaToCtrlOnWindows,
  });

  const keys = [
    ...modifiers.map((label) => ({ label, type: 'modifier' })),
    { label: primaryKey, type: 'primary' },
  ];

  const label = keys.map((k) => k.label).join(' + ');

  let shouldShow = false;
  if (filters.has('all')) {
    shouldShow = true;
  } else {
    if (filters.has('shortcuts') && isShortcut) {
      shouldShow = true;
    }
    if (filters.has('navigation') && isNavigation) {
      shouldShow = true;
    }
  }

  let category = 'keystroke';
  if (isShortcut) {
    category = 'shortcut';
  } else if (isNavigation) {
    category = 'navigation';
  }

  return {
    shouldShow,
    category,
    isShortcut,
    isNavigation,
    isModifierOnly: false,
    modifiers,
    primaryKey,
    keys,
    label,
  };
}

/**
 * Parses a static keystroke string (such as "SHIFT + TAB", "CMD+A", "→", "SHIFT + CMD + T")
 * into structured key objects for rendering.
 *
 * @param {string | string[]} input
 * @param {{ platform?: 'mac' | 'windows', notation?: 'text' | 'symbols' }} [options={}]
 * @returns {{
 *   keys: Array<{ label: string, type: 'modifier' | 'primary' }>,
 *   label: string
 * }}
 */
export function parseKeystrokeString(input, options = {}) {
  if (input === null || input === undefined) {
    return { keys: [], label: '' };
  }

  const notation = options.notation === 'symbols' ? 'symbols' : 'text';
  const labelMap = notation === 'symbols' ? KEY_LABELS_SYMBOLS : KEY_LABELS_TEXT;

  let rawParts = [];
  if (Array.isArray(input)) {
    rawParts = input
      .map((item) => {
        const s = String(item);
        return s.length > 0 && s.trim() === '' ? 'SPACE' : s.trim();
      })
      .filter(Boolean);
  } else {
    const rawStr = String(input);
    if (!rawStr) {
      return { keys: [], label: '' };
    }
    if (rawStr.trim() === '') {
      rawParts = ['SPACE'];
    } else if (rawStr.trim() === '+') {
      rawParts = ['+'];
    } else {
      rawParts = rawStr
        .split(/\s*\+\s*/)
        .map((part) => (part.length > 0 && part.trim() === '' ? 'SPACE' : part.trim()))
        .filter(Boolean);
    }
  }

  const keys = rawParts.map((part, index) => {
    let normalized = part;
    const upper = part.toUpperCase();

    if (upper === 'ARROWRIGHT' || upper === 'RIGHT') normalized = '→';
    else if (upper === 'ARROWLEFT' || upper === 'LEFT') normalized = '←';
    else if (upper === 'ARROWUP' || upper === 'UP') normalized = '↑';
    else if (upper === 'ARROWDOWN' || upper === 'DOWN') normalized = '↓';
    else if (upper === ' ' || upper === 'SPACE' || upper === 'SPACEBAR') normalized = 'SPACE';
    else if (upper === 'COMMAND') normalized = notation === 'symbols' ? '⌘' : 'CMD';
    else if (upper === 'CONTROL') normalized = notation === 'symbols' ? '⌃' : 'CTRL';
    else if (upper === 'OPTION') normalized = notation === 'symbols' ? '⌥' : 'OPT';
    else if (Object.prototype.hasOwnProperty.call(labelMap, part)) {
      normalized = labelMap[part];
    } else {
      normalized = upper;
    }

    const isMod = ALL_MODIFIER_LABELS.has(normalized) && index < rawParts.length - 1;
    return {
      label: normalized,
      type: isMod ? 'modifier' : 'primary',
    };
  });

  return {
    keys,
    label: keys.map((k) => k.label).join(' + '),
  };
}

/**
 * Parses and validates a `position` attribute value.
 * Accepts:
 * - Viewport positioning: two tokens combining vertical ('top' | 'center' | 'bottom')
 *   and horizontal ('left' | 'center' | 'right'), e.g. "top right", "bottom center".
 * - Pointer/mouse positioning: optional leading 'pointer' (or alias 'mouse') keyword
 *   followed by optional vertical and horizontal tokens (e.g. "mouse top right", "pointer bottom left").
 *   When only "pointer" or "mouse" is specified, defaults to bottom right ("pointer bottom right" / "mouse bottom right").
 *
 * @param {string | null | undefined} positionAttr
 * @returns {{
 *   vertical: 'top' | 'center' | 'bottom',
 *   horizontal: 'left' | 'center' | 'right',
 *   pointer?: boolean,
 *   positionArea?: string,
 *   value: string
 * } | null}
 */
export function parsePosition(positionAttr) {
  if (typeof positionAttr !== 'string') {
    return null;
  }

  const tokens = positionAttr
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0 || tokens.length > 3) {
    return null;
  }

  // Case 1: Leading 'pointer' or 'mouse' keyword
  if (VALID_POINTER_KEYWORDS.has(tokens[0])) {
    const prefix = tokens[0];

    if (tokens.length === 1) {
      return {
        vertical: 'bottom',
        horizontal: 'right',
        pointer: true,
        positionArea: 'bottom right',
        value: `${prefix} bottom right`,
      };
    }

    if (tokens.length === 3) {
      const [, second, third] = tokens;
      if (VALID_VERTICAL_POSITIONS.has(second) && VALID_HORIZONTAL_POSITIONS.has(third)) {
        return {
          vertical: second,
          horizontal: third,
          pointer: true,
          positionArea: `${second} ${third}`,
          value: `${prefix} ${second} ${third}`,
        };
      }
      if (VALID_HORIZONTAL_POSITIONS.has(second) && VALID_VERTICAL_POSITIONS.has(third)) {
        return {
          vertical: third,
          horizontal: second,
          pointer: true,
          positionArea: `${third} ${second}`,
          value: `${prefix} ${third} ${second}`,
        };
      }
    }

    return null;
  }

  // Case 2: Standard 2-token viewport positioning
  if (tokens.length !== 2) {
    return null;
  }

  const [first, second] = tokens;

  if (VALID_VERTICAL_POSITIONS.has(first) && VALID_HORIZONTAL_POSITIONS.has(second)) {
    return {
      vertical: first,
      horizontal: second,
      value: `${first} ${second}`,
    };
  }

  if (VALID_HORIZONTAL_POSITIONS.has(first) && VALID_VERTICAL_POSITIONS.has(second)) {
    return {
      vertical: second,
      horizontal: first,
      value: `${second} ${first}`,
    };
  }

  return null;
}

/**
 * Parses a millisecond value (number or string) and returns a non-negative number in ms,
 * falling back to `defaultValue` when null, empty, or invalid.
 *
 * @param {string | number | null | undefined} value
 * @param {number} defaultValue
 * @returns {number}
 */
export function parseDurationMs(value, defaultValue) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return defaultValue;
  }
  return Math.round(num);
}

/**
 * Parses and validates a `size` attribute value ('small' | 'medium' | 'large' | 'x-large' | 'xx-large').
 *
 * @param {string | null | undefined} sizeAttr
 * @returns {'small' | 'medium' | 'large' | 'x-large' | 'xx-large' | null}
 */
export function parseSize(sizeAttr) {
  if (typeof sizeAttr !== 'string') {
    return null;
  }
  const normalized = sizeAttr.trim().toLowerCase();
  if (VALID_SIZES.has(normalized)) {
    return normalized;
  }
  return null;
}

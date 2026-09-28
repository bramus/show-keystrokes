/**
 * Keystroke parsing, normalization, classification, and platform formatting utilities
 * for the <show-keystrokes> custom element.
 */

export const DEFAULT_KEYSTROKES = ['shortcuts', 'navigational'];
export const DEFAULT_IGNORE = ['sensitive'];
export const DEFAULT_TRAIL = 0;
export const DEFAULT_HIDE_DELAY = 1250;
export const DEFAULT_HIDE_DURATION = 200;
export const DEFAULT_SIZE = 'large';
export const DEFAULT_POSITION = 'viewport top right';
export const DEFAULT_NOTATION = 'symbols';

export const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

export const VALID_SIZES = new Set(['small', 'medium', 'large', 'x-large', 'xx-large']);
export const VALID_VERTICAL_POSITIONS = new Set(['top', 'center', 'bottom']);
export const VALID_HORIZONTAL_POSITIONS = new Set(['left', 'center', 'right']);
export const VALID_ANCHOR_KEYWORDS = new Set(['viewport', 'pointer']);

export const MODIFIER_EVENT_KEYS = new Set([
  'Meta',
  'Control',
  'Shift',
  'Alt',
  'AltGraph',
  'Fn',
  'FnLock',
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
  'FN',
  '🌐',
  '🌐\uFE0E',
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
 * Parses a `keystrokes` attribute string (or boolean flags) into a normalized Set of active categories:
 * - (no value / empty): Set(['shortcuts', 'navigational']) (default)
 * - 'all': Set(['all', 'shortcuts', 'navigational'])
 * - 'shortcuts': Set(['shortcuts'])
 * - 'navigational': Set(['navigational'])
 * - 'none': Set() (empty set — shows nothing)
 *
 * @param {string | null | undefined} keystrokesAttr
 * @param {{ all?: boolean, shortcuts?: boolean, navigational?: boolean, navigation?: boolean }} [booleanFlags={}]
 * @returns {Set<'all' | 'shortcuts' | 'navigational'>}
 */
export function parseKeystrokes(keystrokesAttr, booleanFlags = {}) {
  const result = new Set();

  if (typeof keystrokesAttr === 'string' && keystrokesAttr.trim().length > 0) {
    const tokens = keystrokesAttr
      .toLowerCase()
      .split(/[\s,|+/]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    for (const token of tokens) {
      if (token === 'none' || token === 'off' || token === 'nothing') {
        return new Set();
      } else if (token === 'all' || token === '*' || token === 'any' || token === 'keystrokes') {
        result.add('all');
        result.add('shortcuts');
        result.add('navigational');
      } else if (token === 'shortcut' || token === 'shortcuts' || token === 'hotkeys' || token === 'combos') {
        result.add('shortcuts');
      } else if (
        token === 'navigational' ||
        token === 'navigation' ||
        token === 'nav' ||
        token === 'arrows'
      ) {
        result.add('navigational');
      }
    }
  } else {
    if (booleanFlags.all) {
      result.add('all');
      result.add('shortcuts');
      result.add('navigational');
    }
    if (booleanFlags.shortcuts) {
      result.add('shortcuts');
    }
    if (booleanFlags.navigational || booleanFlags.navigation) {
      result.add('navigational');
    }
  }

  if (result.size === 0) {
    return new Set(DEFAULT_KEYSTROKES);
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
  const notation = options.notation === 'text' ? 'text' : DEFAULT_NOTATION;
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
 * - macOS:   FN -> CTRL -> ALT -> SHIFT -> CMD   (e.g. `SHIFT + CMD + T`, `CMD + A`, `SHIFT + TAB`)
 * - Windows: FN -> WIN  -> ALT -> SHIFT -> CTRL  (e.g. `SHIFT + CTRL + T`, `CTRL + A`, `SHIFT + TAB`)
 *
 * @param {KeyboardEvent | { ctrlKey?: boolean, altKey?: boolean, shiftKey?: boolean, metaKey?: boolean, fnKey?: boolean, getModifierState?: Function, key?: string }} event
 * @param {{ platform?: 'mac' | 'windows', notation?: 'text' | 'symbols', mapMetaToCtrlOnWindows?: boolean }} [options={}]
 * @returns {string[]}
 */
export function getModifierLabels(event, options = {}) {
  const platform = options.platform || 'mac';
  const notation = options.notation === 'text' ? 'text' : DEFAULT_NOTATION;
  const mapMetaToCtrlOnWindows = Boolean(options.mapMetaToCtrlOnWindows);

  const fn =
    Boolean(event?.fnKey) ||
    (typeof event?.getModifierState === 'function' && Boolean(event.getModifierState('Fn')));
  const ctrl = Boolean(event?.ctrlKey) || (platform === 'windows' && mapMetaToCtrlOnWindows && Boolean(event?.metaKey));
  const alt = Boolean(event?.altKey);
  const shift = Boolean(event?.shiftKey);
  const meta = platform === 'windows' && mapMetaToCtrlOnWindows ? false : Boolean(event?.metaKey);

  const modifiers = [];

  if (platform === 'mac') {
    if (fn) modifiers.push(notation === 'symbols' ? '🌐\uFE0E' : 'FN');
    if (ctrl) modifiers.push(notation === 'symbols' ? '⌃' : 'CTRL');
    if (alt) modifiers.push(notation === 'symbols' ? '⌥' : 'ALT');
    if (shift) modifiers.push(notation === 'symbols' ? '⇧' : 'SHIFT');
    if (meta) modifiers.push(notation === 'symbols' ? '⌘' : 'CMD');
  } else {
    if (fn) modifiers.push('FN');
    if (meta) modifiers.push(notation === 'symbols' ? '⊞' : 'WIN');
    if (alt) modifiers.push('ALT');
    if (shift) modifiers.push(notation === 'symbols' ? '⇧' : 'SHIFT');
    if (ctrl) modifiers.push('CTRL');
  }

  return modifiers;
}

/**
 * Parses the `ignore` attribute/property value into a normalized Set of ignored target categories:
 * - (no value / empty) or 'sensitive': Set(['sensitive']) (default — ignores `<input type="password">`)
 * - 'editable': Set(['editable', 'sensitive']) (ignores text inputs, `<textarea>`, `[contenteditable]`, and `<input type="password">`)
 * - 'none': Set() (empty set — ignores nothing, showing keystrokes even in `<input type="password">`)
 *
 * @param {string | string[] | Set<string> | null | undefined} value
 * @returns {Set<'sensitive' | 'editable'>}
 */
export function parseIgnore(value) {
  if (value instanceof Set) {
    if (value.size === 0) {
      return new Set();
    }
    return parseIgnore(Array.from(value).join(' '));
  }

  if (Array.isArray(value)) {
    return parseIgnore(value.join(' '));
  }

  if (typeof value !== 'string' || !value.trim()) {
    return new Set(DEFAULT_IGNORE);
  }

  const tokens = value
    .toLowerCase()
    .split(/[\s,|+/]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result = new Set();

  for (const token of tokens) {
    if (token === 'none' || token === 'off' || token === 'nothing') {
      return new Set();
    } else if (
      token === 'editable' ||
      token === 'editables' ||
      token === 'text' ||
      token === 'text-inputs' ||
      token === 'inputs' ||
      token === 'all'
    ) {
      result.add('editable');
      result.add('sensitive');
    } else if (token === 'sensitive' || token === 'password' || token === 'passwords') {
      result.add('sensitive');
    }
  }

  if (result.size === 0) {
    return new Set(DEFAULT_IGNORE);
  }

  return result;
}

/**
 * Checks whether a given DOM element (or event target mock) is a sensitive input (`<input type="password">`).
 *
 * @param {Element | object | null | undefined} el
 * @returns {boolean}
 */
export function isSensitiveInputElement(el) {
  if (!el || typeof el !== 'object') {
    return false;
  }
  const tagName = typeof el.tagName === 'string' ? el.tagName.toUpperCase() : '';
  if (tagName !== 'INPUT') {
    return false;
  }
  const typeAttr =
    typeof el.getAttribute === 'function' ? el.getAttribute('type') : undefined;
  const typeProp = typeof el.type === 'string' ? el.type : '';
  const effectiveType = (typeAttr || typeProp || '').trim().toLowerCase();
  return effectiveType === 'password';
}

/**
 * Checks whether a given DOM element (or event target mock) is an editable text element:
 * - `<input>` whose `type` is a text/value entry type (e.g. `text`, `number`, `email`, `search`, `tel`, `url`, `password`, etc. — excluding non-text controls like `checkbox`, `radio`, `range`, `button`, `submit`, `reset`, `color`, `file`, `image`, `hidden`)
 * - `<textarea>`
 * - `[contenteditable]` element (or descendant of a `contenteditable` element)
 *
 * @param {Element | object | null | undefined} el
 * @returns {boolean}
 */
export function isEditableElement(el) {
  if (!el || typeof el !== 'object') {
    return false;
  }

  const tagName = typeof el.tagName === 'string' ? el.tagName.toUpperCase() : '';
  if (tagName === 'TEXTAREA') {
    return true;
  }

  if (tagName === 'INPUT') {
    const typeAttr =
      typeof el.getAttribute === 'function' ? el.getAttribute('type') : undefined;
    const typeProp = typeof el.type === 'string' ? el.type : '';
    const effectiveType = (typeAttr || typeProp || 'text').trim().toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(effectiveType);
  }

  if (typeof el.isContentEditable === 'boolean' && el.isContentEditable) {
    return true;
  }

  const ceAttr =
    typeof el.getAttribute === 'function' ? el.getAttribute('contenteditable') : undefined;
  if (typeof ceAttr === 'string') {
    const normalizedCe = ceAttr.trim().toLowerCase();
    if (
      normalizedCe === '' ||
      normalizedCe === 'true' ||
      normalizedCe === 'plaintext-only'
    ) {
      return true;
    }
  }

  if (typeof el.contentEditable === 'string') {
    const normalizedProp = el.contentEditable.trim().toLowerCase();
    if (normalizedProp === 'true' || normalizedProp === 'plaintext-only') {
      return true;
    }
  }

  if (typeof el.closest === 'function') {
    const editableAncestor = el.closest('[contenteditable]:not([contenteditable="false" i])');
    if (editableAncestor) {
      return true;
    }
  }

  return false;
}

/**
 * Resolves the focused/targeted element from `event` (via `composedPath()[0]` or `event.target`)
 * or `doc.activeElement` (traversing open Shadow Roots), and checks `predicate`.
 *
 * @param {(el: any) => boolean} predicate
 * @param {KeyboardEvent | object | null | undefined} [event]
 * @param {Document | object | null | undefined} [doc]
 * @returns {boolean}
 */
function matchesFocusedOrTargetElement(
  predicate,
  event,
  doc = typeof document !== 'undefined' ? document : null
) {
  if (event && typeof event === 'object') {
    if (typeof event.composedPath === 'function') {
      const path = event.composedPath();
      if (Array.isArray(path) && path.length > 0 && predicate(path[0])) {
        return true;
      }
    }
    if (predicate(event.target)) {
      return true;
    }
  }

  if (doc && typeof doc === 'object' && doc.activeElement) {
    let active = doc.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    if (predicate(active)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a sensitive input (`<input type="password">`) is the target of `event` or is currently focused.
 * Traverses `event.composedPath()` and `document.activeElement` (including open Shadow Roots).
 *
 * @param {KeyboardEvent | object | null | undefined} [event]
 * @param {Document | object | null | undefined} [doc]
 * @returns {boolean}
 */
export function isSensitiveInputFocused(event, doc = typeof document !== 'undefined' ? document : null) {
  return matchesFocusedOrTargetElement(isSensitiveInputElement, event, doc);
}

/**
 * Checks whether an editable element (`<input type="text|number|email|...">`, `<textarea>`, `[contenteditable]`, or `<input type="password">`)
 * is the target of `event` or is currently focused.
 * Traverses `event.composedPath()` and `document.activeElement` (including open Shadow Roots).
 *
 * @param {KeyboardEvent | object | null | undefined} [event]
 * @param {Document | object | null | undefined} [doc]
 * @returns {boolean}
 */
export function isEditableElementFocused(event, doc = typeof document !== 'undefined' ? document : null) {
  return matchesFocusedOrTargetElement(isEditableElement, event, doc);
}

/**
 * Classifies a KeyboardEvent into its categories (`isShortcut`, `isNavigation`, `isModifierOnly`)
 * and determines whether it should be displayed under the given `keystrokes` Set.
 *
 * @param {KeyboardEvent | object} event
 * @param {{
 *   keystrokes?: Set<string> | string,
 *   ignore?: Set<string> | string | string[],
 *   platform?: 'mac' | 'windows',
 *   notation?: 'text' | 'symbols',
 *   mapMetaToCtrlOnWindows?: boolean,
 *   document?: Document | object
 * }} [options={}]
 * @returns {{
 *   shouldShow: boolean,
 *   category: 'shortcut' | 'navigational' | 'keystroke' | 'modifier' | 'ignored',
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
  const ignoreSet = options.ignore instanceof Set ? options.ignore : parseIgnore(options.ignore);
  if (
    (ignoreSet.has('editable') && isEditableElementFocused(event, options.document)) ||
    (ignoreSet.has('sensitive') && isSensitiveInputFocused(event, options.document))
  ) {
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

  const keystrokesSet = options.keystrokes instanceof Set ? options.keystrokes : parseKeystrokes(options.keystrokes);
  const platform = detectPlatform(options.platform);
  const notation = options.notation === 'text' ? 'text' : DEFAULT_NOTATION;

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

  const hasFn =
    Boolean(event?.fnKey) ||
    (typeof event?.getModifierState === 'function' && Boolean(event.getModifierState('Fn')));
  const hasPrimaryModifier = Boolean(event?.metaKey || event?.ctrlKey || event?.altKey || hasFn);
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
  // 1. Any primary modifier (CMD / CTRL / ALT / WIN / FN) is held with a key (e.g. CMD+A, SHIFT+CMD+T, CTRL+C)
  // 2. SHIFT is held with a navigation/special/function key (e.g. SHIFT+TAB, SHIFT+ENTER, SHIFT+ESC)
  // 3. A function key (F1-F24) is pressed
  const isShortcut = hasPrimaryModifier || (hasShift && (isSpecialActionKey || isFnKey)) || isFnKey;

  // A keystroke is a navigational/special key when a navigation/editing/function key
  // (Arrows, TAB, BACKSPACE, DELETE, SPACE, F1-F24, HOME, END, PAGE UP/DOWN, ENTER, ESC)
  // is pressed without CMD/CTRL/ALT (or with SHIFT, e.g. →, TAB, SHIFT + TAB, BACKSPACE, SPACE, DELETE, F1-F15).
  const isNavigation = (isNavKey || isFnKey) && !hasPrimaryModifier;

  const modifiers = isShortcut
    ? getModifierLabels(event, {
        platform,
        notation,
        mapMetaToCtrlOnWindows: options.mapMetaToCtrlOnWindows,
      })
    : [];

  const keys = [
    ...modifiers.map((label) => ({ label, type: 'modifier' })),
    { label: primaryKey, type: 'primary' },
  ];

  const label = keys.map((k) => k.label).join(' + ');

  let shouldShow = false;
  if (keystrokesSet.has('all')) {
    shouldShow = true;
  } else {
    if (keystrokesSet.has('shortcuts') && isShortcut) {
      shouldShow = true;
    }
    if ((keystrokesSet.has('navigational') || keystrokesSet.has('navigation')) && isNavigation) {
      shouldShow = true;
    }
  }

  let category = 'keystroke';
  if (isShortcut) {
    category = 'shortcut';
  } else if (isNavigation) {
    category = 'navigational';
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

  const notation = options.notation === 'text' ? 'text' : DEFAULT_NOTATION;
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
    else if (upper === 'CMD' || upper === 'COMMAND' || upper === 'META' || part === '⌘') {
      normalized = notation === 'symbols' ? '⌘' : 'CMD';
    } else if (upper === 'CTRL' || upper === 'CONTROL' || part === '⌃') {
      normalized = notation === 'symbols' ? '⌃' : 'CTRL';
    } else if (upper === 'OPT' || upper === 'OPTION' || part === '⌥') {
      normalized = notation === 'symbols' ? '⌥' : 'OPT';
    } else if (upper === 'ALT') {
      normalized = notation === 'symbols' ? '⌥' : 'ALT';
    } else if (upper === 'SHIFT' || part === '⇧') {
      normalized = notation === 'symbols' ? '⇧' : 'SHIFT';
    } else if (upper === 'FN' || part === '🌐' || part === '🌐\uFE0E') {
      normalized = notation === 'symbols' ? '🌐\uFE0E' : 'FN';
    } else if (upper === 'WIN' || upper === 'WINDOWS' || upper === 'SUPER' || part === '⊞') {
      normalized = notation === 'symbols' ? '⊞' : 'WIN';
    } else if (upper === 'TAB' || part === '⇥') {
      normalized = notation === 'symbols' ? '⇥' : 'TAB';
    } else if (upper === 'ENTER' || upper === 'RETURN' || part === '↵') {
      normalized = notation === 'symbols' ? '↵' : 'ENTER';
    } else if (upper === 'ESC' || upper === 'ESCAPE' || part === '⎋') {
      normalized = notation === 'symbols' ? '⎋' : 'ESC';
    } else if (upper === 'BACKSPACE' || part === '⌫') {
      normalized = notation === 'symbols' ? '⌫' : 'BACKSPACE';
    } else if (upper === 'DELETE' || upper === 'DEL' || part === '⌦') {
      normalized = notation === 'symbols' ? '⌦' : 'DELETE';
    } else if (upper === 'HOME' || part === '↖') {
      normalized = notation === 'symbols' ? '↖' : 'HOME';
    } else if (upper === 'END' || part === '↘') {
      normalized = notation === 'symbols' ? '↘' : 'END';
    } else if (upper === 'PAGE UP' || upper === 'PAGEUP' || part === '⇞') {
      normalized = notation === 'symbols' ? '⇞' : 'PAGE UP';
    } else if (upper === 'PAGE DOWN' || upper === 'PAGEDOWN' || part === '⇟') {
      normalized = notation === 'symbols' ? '⇟' : 'PAGE DOWN';
    } else if (upper === 'CAPS LOCK' || upper === 'CAPSLOCK' || part === '⇪') {
      normalized = notation === 'symbols' ? '⇪' : 'CAPS LOCK';
    } else if (Object.prototype.hasOwnProperty.call(labelMap, part)) {
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
 * - Normal positioning: "normal"
 * - Viewport positioning: "viewport", "viewport <top|center|bottom> <left|center|right>",
 *   or "<top|center|bottom> <left|center|right>". When only "viewport" is specified, defaults to "viewport top right".
 * - Pointer positioning: "pointer" or "pointer <top|center|bottom> <left|center|right>".
 *   When only "pointer" is specified, defaults to "pointer bottom right".
 *
 * @param {string | null | undefined} positionAttr
 * @returns {{
 *   anchor: 'viewport' | 'pointer' | 'normal',
 *   vertical?: 'top' | 'center' | 'bottom',
 *   horizontal?: 'left' | 'center' | 'right',
 *   pointer?: boolean,
 *   normal?: boolean,
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

  // Case 1: "normal"
  if (tokens.length === 1 && tokens[0] === 'normal') {
    return {
      anchor: 'normal',
      normal: true,
      value: 'normal',
    };
  }

  // Case 2: Leading 'viewport' or 'pointer' keyword
  if (VALID_ANCHOR_KEYWORDS.has(tokens[0])) {
    const anchor = tokens[0];
    const isPointer = anchor === 'pointer';

    if (tokens.length === 1) {
      const defaultVertical = isPointer ? 'bottom' : 'top';
      const defaultHorizontal = 'right';
      return {
        anchor,
        vertical: defaultVertical,
        horizontal: defaultHorizontal,
        ...(isPointer ? { pointer: true } : {}),
        positionArea: `${defaultVertical} ${defaultHorizontal}`,
        value: `${anchor} ${defaultVertical} ${defaultHorizontal}`,
      };
    }

    if (tokens.length === 3) {
      const [, second, third] = tokens;
      if (VALID_VERTICAL_POSITIONS.has(second) && VALID_HORIZONTAL_POSITIONS.has(third)) {
        return {
          anchor,
          vertical: second,
          horizontal: third,
          ...(isPointer ? { pointer: true } : {}),
          positionArea: `${second} ${third}`,
          value: `${anchor} ${second} ${third}`,
        };
      }
      if (VALID_HORIZONTAL_POSITIONS.has(second) && VALID_VERTICAL_POSITIONS.has(third)) {
        return {
          anchor,
          vertical: third,
          horizontal: second,
          ...(isPointer ? { pointer: true } : {}),
          positionArea: `${third} ${second}`,
          value: `${anchor} ${third} ${second}`,
        };
      }
    }

    return null;
  }

  // Case 3: Standard 2-token viewport positioning (e.g. "top right")
  if (tokens.length !== 2) {
    return null;
  }

  const [first, second] = tokens;

  if (VALID_VERTICAL_POSITIONS.has(first) && VALID_HORIZONTAL_POSITIONS.has(second)) {
    return {
      anchor: 'viewport',
      vertical: first,
      horizontal: second,
      positionArea: `${first} ${second}`,
      value: `${first} ${second}`,
    };
  }

  if (VALID_HORIZONTAL_POSITIONS.has(first) && VALID_VERTICAL_POSITIONS.has(second)) {
    return {
      anchor: 'viewport',
      vertical: second,
      horizontal: first,
      positionArea: `${second} ${first}`,
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

const NAVIGATIONAL_NORMALIZED_LABELS = new Set([
  ...Object.values(KEY_LABELS_TEXT),
  ...Object.values(KEY_LABELS_SYMBOLS),
]);

/**
 * Parses a `trail` value (number or string) and returns a non-negative integer (>= 0),
 * falling back to `defaultValue` (`DEFAULT_TRAIL = 0`) when null, empty, or invalid.
 *
 * @param {string | number | null | undefined} value
 * @param {number} [defaultValue=DEFAULT_TRAIL]
 * @returns {number}
 */
export function parseTrail(value, defaultValue = DEFAULT_TRAIL) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return defaultValue;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return defaultValue;
  }
  return Math.max(0, Math.round(num));
}

/**
 * Classifies a parsed key array into `'shortcut' | 'navigational' | 'keystroke'`.
 *
 * @param {Array<{ label: string, type: 'modifier' | 'primary' }>} keys
 * @returns {'shortcut' | 'navigational' | 'keystroke'}
 */
function classifyParsedKeys(keys) {
  if (!Array.isArray(keys) || keys.length === 0) {
    return 'keystroke';
  }
  if (keys.length > 1) {
    return 'shortcut';
  }
  const primaryLabel = keys[0]?.label || '';
  if (isFunctionKey(primaryLabel)) {
    return 'shortcut';
  }
  if (NAVIGATIONAL_NORMALIZED_LABELS.has(primaryLabel)) {
    return 'navigational';
  }
  return 'keystroke';
}

/**
 * Determines whether a comma separator should be placed between two adjacent sequence items.
 * Consecutive plain characters (`category === 'keystroke'`) sit side-by-side without commas
 * (e.g. `H`, `E`, `L`, `L`, `O`), whereas shortcuts and navigational keys are separated by a comma
 * (e.g. `⌘ + B, K` or `⇥, →`).
 *
 * @param {{ category?: string }} prevItem
 * @param {{ category?: string }} nextItem
 * @returns {boolean}
 */
export function needsCommaSeparator(prevItem, nextItem) {
  if (!prevItem || !nextItem) {
    return false;
  }
  const prevCat = prevItem.category || 'keystroke';
  const nextCat = nextItem.category || 'keystroke';
  return prevCat !== 'keystroke' || nextCat !== 'keystroke';
}

/**
 * Formats an array of sequence items into a combined display label string.
 * - Repeated navigational/shortcut items include a `×N` suffix (e.g. `⇥×2`).
 * - Adjacent items separated by a comma use `', '` (e.g. `⌘ + B, K`).
 * - Consecutive plain characters are joined by `' '` (e.g. `H E L L O`).
 *
 * @param {Array<{ label: string, category?: string, count?: number }>} sequence
 * @returns {string}
 */
export function formatSequenceLabel(sequence) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return '';
  }

  let result = '';
  for (let i = 0; i < sequence.length; i++) {
    const item = sequence[i];
    if (!item || !item.label) {
      continue;
    }
    const itemText = item.count && item.count > 1 ? `${item.label}×${item.count}` : item.label;
    if (i === 0 || !result) {
      result = itemText;
    } else if (needsCommaSeparator(sequence[i - 1], item)) {
      result += `, ${itemText}`;
    } else {
      result += ` ${itemText}`;
    }
  }

  return result;
}

/**
 * Counts the total number of individual keys across a sequence of items.
 *
 * @param {Array<{ keys?: Array<any> }>} sequence
 * @returns {number}
 */
function countSequenceKeys(sequence) {
  let total = 0;
  for (const entry of sequence) {
    total += Array.isArray(entry?.keys) && entry.keys.length > 0 ? entry.keys.length : 1;
  }
  return total;
}

/**
 * Trims oldest sequence items from the front until the total number of individual keys
 * across the sequence is at most `maxKeys` (always retaining at least the latest item).
 *
 * @param {Array<{ keys: Array<{ label: string, type: 'modifier' | 'primary' }>, label: string, category: 'shortcut' | 'navigational' | 'keystroke', count: number }>} sequence
 * @param {number} maxKeys
 * @returns {Array<{ keys: Array<{ label: string, type: 'modifier' | 'primary' }>, label: string, category: 'shortcut' | 'navigational' | 'keystroke', count: number }>}
 */
function trimSequenceToTrail(sequence, maxKeys) {
  if (!Number.isFinite(maxKeys)) {
    return sequence;
  }
  let totalKeys = countSequenceKeys(sequence);
  let startIndex = 0;
  while (totalKeys > maxKeys && sequence.length - startIndex > 1) {
    const evicted = sequence[startIndex];
    const evictedKeyCount =
      Array.isArray(evicted?.keys) && evicted.keys.length > 0 ? evicted.keys.length : 1;
    totalKeys -= evictedKeyCount;
    startIndex++;
  }
  return startIndex > 0 ? sequence.slice(startIndex) : sequence;
}

/**
 * Appends a new keystroke item to an existing sequence buffer while enforcing `trail`:
 * - Consecutive identical navigational keys or shortcuts (e.g. `TAB` then `TAB`, or `⌘ + Z` then `⌘ + Z`)
 *   collapse into the last item and increment its `count` (`2`, `3`, ...).
 * - Plain character keystrokes (`category === 'keystroke'`, e.g. the two `L`s in `"hello"`)
 *   never collapse and always append as separate items.
 * - `trail` counts individual keys (e.g. `⌘ + B` counts as 2 keys) rather than groups of keystrokes.
 *
 * @param {Array<{ keys: Array<{ label: string, type: 'modifier' | 'primary' }>, label: string, category: 'shortcut' | 'navigational' | 'keystroke', count: number }>} sequence
 * @param {{ keys: Array<{ label: string, type: 'modifier' | 'primary' }>, label: string, category?: 'shortcut' | 'navigational' | 'keystroke', isShortcut?: boolean, isNavigation?: boolean, count?: number }} item
 * @param {number | string} [trail=DEFAULT_TRAIL]
 * @returns {Array<{ keys: Array<{ label: string, type: 'modifier' | 'primary' }>, label: string, category: 'shortcut' | 'navigational' | 'keystroke', count: number }>}
 */
export function appendKeystrokeToSequence(sequence, item, trail = DEFAULT_TRAIL) {
  const maxKeys = trail === Infinity ? Infinity : parseTrail(trail, DEFAULT_TRAIL);
  const next = Array.isArray(sequence)
    ? sequence.map((entry) => ({
        ...entry,
        keys: Array.isArray(entry.keys) ? [...entry.keys] : [],
        count: entry.count && entry.count > 1 ? entry.count : 1,
      }))
    : [];

  if (!item || !item.label || !Array.isArray(item.keys) || item.keys.length === 0) {
    return trimSequenceToTrail(next, maxKeys);
  }

  const category =
    item.category ||
    (item.isShortcut ? 'shortcut' : item.isNavigation ? 'navigational' : classifyParsedKeys(item.keys));
  const itemCount = item.count && item.count > 1 ? item.count : 1;
  const isCollapsible = category === 'shortcut' || category === 'navigational';

  const last = next[next.length - 1];
  if (
    last &&
    isCollapsible &&
    (last.category === 'shortcut' || last.category === 'navigational') &&
    last.label === item.label
  ) {
    last.count = (last.count || 1) + itemCount;
  } else {
    next.push({
      ...(item.id !== undefined ? { id: item.id } : {}),
      keys: item.keys,
      label: item.label,
      category,
      count: itemCount,
    });
  }

  return trimSequenceToTrail(next, maxKeys);
}

/**
 * Parses a static keystroke or sequence string/array (e.g. `"SHIFT + CMD + K"`, `"CMD + B, K"`,
 * `"H E L L O"`, `"TAB×2"`, or `['SHIFT', 'TAB']`) into a normalized sequence of items.
 *
 * @param {string | string[]} input
 * @param {{ platform?: 'mac' | 'windows', notation?: 'text' | 'symbols', trail?: number | string }} [options={}]
 * @returns {{
 *   sequence: Array<{ keys: Array<{ label: string, type: 'modifier' | 'primary' }>, label: string, category: 'shortcut' | 'navigational' | 'keystroke', count: number }>,
 *   keys: Array<{ label: string, type: 'modifier' | 'primary' }>,
 *   label: string
 * }}
 */
export function parseKeystrokeSequence(input, options = {}) {
  if (input === null || input === undefined) {
    return { sequence: [], keys: [], label: '' };
  }

  const trail =
    options.trail !== undefined && options.trail !== null
      ? parseTrail(options.trail, DEFAULT_TRAIL)
      : Infinity;

  let sequence = [];

  const appendParsedToken = (rawToken, explicitCount = 1) => {
    const parsed = parseKeystrokeString(rawToken, options);
    if (parsed.keys.length === 0) {
      return;
    }
    const category = classifyParsedKeys(parsed.keys);
    sequence = appendKeystrokeToSequence(
      sequence,
      {
        keys: parsed.keys,
        label: parsed.label,
        category,
        count: explicitCount,
      },
      trail
    );
  };

  if (Array.isArray(input)) {
    if (input.length === 0) {
      return { sequence: [], keys: [], label: '' };
    }
    const parsedCombo = parseKeystrokeString(input, options);
    const allLeadingAreModifiers =
      parsedCombo.keys.length > 1 &&
      parsedCombo.keys.slice(0, -1).every((k) => k.type === 'modifier');

    if (allLeadingAreModifiers || input.length === 1) {
      if (parsedCombo.keys.length > 0) {
        sequence = appendKeystrokeToSequence(
          sequence,
          {
            keys: parsedCombo.keys,
            label: parsedCombo.label,
            category: classifyParsedKeys(parsedCombo.keys),
            count: 1,
          },
          trail
        );
      }
    } else {
      for (const part of input) {
        appendParsedToken(part, 1);
      }
    }
  } else {
    const rawStr = String(input);
    if (!rawStr) {
      return { sequence: [], keys: [], label: '' };
    }

    const trimmed = rawStr.trim();
    if (trimmed === '') {
      appendParsedToken('SPACE', 1);
    } else if (trimmed === ',' || trimmed === '+') {
      appendParsedToken(trimmed, 1);
    } else {
      // Split on commas that are not preceded by '+' (so "CMD + ," remains intact)
      const commaSegments = trimmed.split(/(?<!\+\s*),/).map((s) => s.trim()).filter(Boolean);

      for (const seg of commaSegments) {
        const countMatch = seg.match(/^(.+?)×(\d+)$/);
        const baseSeg = countMatch ? countMatch[1].trim() : seg;
        const explicitCount = countMatch ? Math.max(1, parseInt(countMatch[2], 10)) : 1;

        const isMultiWordSpecial = /^(page\s+up|page\s+down|caps\s+lock)$/i.test(baseSeg);
        if (!baseSeg.includes('+') && !isMultiWordSpecial && /\s+/.test(baseSeg)) {
          const tokens = baseSeg.split(/\s+/).filter(Boolean);
          for (const tok of tokens) {
            const tokMatch = tok.match(/^(.+?)×(\d+)$/);
            if (tokMatch) {
              appendParsedToken(tokMatch[1], Math.max(1, parseInt(tokMatch[2], 10)));
            } else {
              appendParsedToken(tok, 1);
            }
          }
        } else {
          appendParsedToken(baseSeg, explicitCount);
        }
      }
    }
  }

  return {
    sequence,
    keys: sequence.flatMap((item) => item.keys),
    label: formatSequenceLabel(sequence),
  };
}


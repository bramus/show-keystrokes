/**
 * show-keystrokes entry point
 * Defines <show-keystrokes> custom element and exports ShowKeystrokes class & keystroke utilities.
 */

import { ShowKeystrokes } from './components/show-keystrokes.js';
import {
  DEFAULT_KEYSTROKES,
  DEFAULT_TIMEOUT,
  DEFAULT_FADE_DURATION,
  DEFAULT_SIZE,
  DEFAULT_POSITION,
  VALID_SIZES,
  VALID_VERTICAL_POSITIONS,
  VALID_HORIZONTAL_POSITIONS,
  detectPlatform,
  parseKeystrokes,
  parsePosition,
  parseDurationMs,
  parseSize,
  isModifierKey,
  isFunctionKey,
  normalizeKeyLabel,
  getModifierLabels,
  formatKeystrokeEvent,
  parseKeystrokeString,
} from './utils/keystroke.js';

if (typeof customElements !== 'undefined' && !customElements.get('show-keystrokes')) {
  customElements.define('show-keystrokes', ShowKeystrokes);
}

const OPTION_TO_ATTR = {
  keystrokes: 'keystrokes',
  theme: 'theme',
  colorScheme: 'color-scheme',
  platform: 'platform',
  size: 'size',
  position: 'position',
  timeout: 'timeout',
  fadeDuration: 'fade-duration',
  notation: 'notation',
  keys: 'keys',
  target: 'target',
  disabled: 'disabled',
  static: 'static',
};

const BOOLEAN_ATTRIBUTES = new Set(['disabled', 'static']);

/**
 * Dynamically creates and configures a `<show-keystrokes>` element,
 * appending it to `parentElement` (defaults to `document.body`).
 *
 * @param {object} [options={}] - CamelCase options to configure `keystrokes`, `theme`, `colorScheme`, `size`, `position`, `timeout`, `fadeDuration`, `platform`, `disabled`, `static`, `keys`, etc.
 * @param {Element} [parentElement=document.body] - Element to append the newly created `<show-keystrokes>` element to.
 * @returns {ShowKeystrokes}
 */
function create(options = {}, parentElement = document.body) {
  if (typeof customElements !== 'undefined' && !customElements.get('show-keystrokes')) {
    customElements.define('show-keystrokes', ShowKeystrokes);
  }

  const el = document.createElement('show-keystrokes');

  if (options && typeof options === 'object') {
    for (const [key, value] of Object.entries(options)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (key === 'id') {
        el.id = String(value);
        continue;
      }

      if (key === 'className') {
        el.className = String(value);
        continue;
      }

      const attrName = OPTION_TO_ATTR[key];
      if (!attrName) {
        continue;
      }

      if (BOOLEAN_ATTRIBUTES.has(attrName)) {
        if (Boolean(value)) {
          el.setAttribute(attrName, '');
        } else {
          el.removeAttribute(attrName);
        }
        continue;
      }

      if (attrName === 'keystrokes' && Array.isArray(value)) {
        el.setAttribute('keystrokes', value.join(' '));
        continue;
      }

      if (attrName === 'keys' && Array.isArray(value)) {
        el.setAttribute('keys', value.join(' + '));
        continue;
      }

      el.setAttribute(attrName, String(value));
    }
  }

  if (parentElement && typeof parentElement.appendChild === 'function') {
    parentElement.appendChild(el);
  }

  return el;
}

export {
  ShowKeystrokes,
  create,
  DEFAULT_KEYSTROKES,
  DEFAULT_TIMEOUT,
  DEFAULT_FADE_DURATION,
  DEFAULT_SIZE,
  DEFAULT_POSITION,
  VALID_SIZES,
  VALID_VERTICAL_POSITIONS,
  VALID_HORIZONTAL_POSITIONS,
  detectPlatform,
  parseKeystrokes,
  parsePosition,
  parseDurationMs,
  parseSize,
  isModifierKey,
  isFunctionKey,
  normalizeKeyLabel,
  getModifierLabels,
  formatKeystrokeEvent,
  parseKeystrokeString,
};

export default ShowKeystrokes;

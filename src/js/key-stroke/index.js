/**
 * key-stroke entry point
 * Defines <key-stroke> custom element and exports KeyStroke class & keystroke utilities.
 */

import { KeyStroke } from './components/key-stroke.js';
import {
  DEFAULT_FILTERS,
  DEFAULT_TIMEOUT,
  DEFAULT_FADE_DURATION,
  DEFAULT_SIZE,
  VALID_SIZES,
  VALID_VERTICAL_POSITIONS,
  VALID_HORIZONTAL_POSITIONS,
  detectPlatform,
  parseFilters,
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

if (typeof customElements !== 'undefined' && !customElements.get('key-stroke')) {
  customElements.define('key-stroke', KeyStroke);
}

export {
  KeyStroke,
  DEFAULT_FILTERS,
  DEFAULT_TIMEOUT,
  DEFAULT_FADE_DURATION,
  DEFAULT_SIZE,
  VALID_SIZES,
  VALID_VERTICAL_POSITIONS,
  VALID_HORIZONTAL_POSITIONS,
  detectPlatform,
  parseFilters,
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

export default KeyStroke;

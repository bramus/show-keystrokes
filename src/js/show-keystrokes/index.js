/**
 * show-keystrokes entry point
 * Defines <show-keystrokes> custom element and exports ShowKeystrokes class & keystroke utilities.
 */

import { ShowKeystrokes } from './components/show-keystrokes.js';
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

if (typeof customElements !== 'undefined' && !customElements.get('show-keystrokes')) {
  customElements.define('show-keystrokes', ShowKeystrokes);
}

export {
  ShowKeystrokes,
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

export default ShowKeystrokes;

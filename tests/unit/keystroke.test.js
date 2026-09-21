import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_FILTERS,
  DEFAULT_TIMEOUT,
  DEFAULT_FADE_DURATION,
  DEFAULT_SIZE,
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
} from '../../src/js/key-stroke/utils/keystroke.js';

describe('keystroke utilities unit tests', () => {
  describe('detectPlatform()', () => {
    it('supports explicit mac and windows overrides', () => {
      assert.equal(detectPlatform('mac'), 'mac');
      assert.equal(detectPlatform('macos'), 'mac');
      assert.equal(detectPlatform('windows'), 'windows');
      assert.equal(detectPlatform('win'), 'windows');
    });

    it('detects macOS and Windows from navigator object when auto', () => {
      assert.equal(detectPlatform('auto', { platform: 'MacIntel' }), 'mac');
      assert.equal(detectPlatform('auto', { platform: 'Win32' }), 'windows');
      assert.equal(detectPlatform('auto', { userAgentData: { platform: 'macOS' } }), 'mac');
      assert.equal(detectPlatform('auto', { userAgentData: { platform: 'Windows' } }), 'windows');
    });
  });

  describe('parseFilters()', () => {
    it('defaults to shortcuts and navigation when omitted or empty', () => {
      const filters = parseFilters(undefined);
      assert.deepEqual(Array.from(filters), DEFAULT_FILTERS);
      assert.equal(filters.has('shortcuts'), true);
      assert.equal(filters.has('navigation'), true);
      assert.equal(filters.has('all'), false);
    });

    it('parses "all", "shortcuts", and "navigation" configurations', () => {
      assert.equal(parseFilters('all').has('all'), true);
      assert.deepEqual(Array.from(parseFilters('shortcuts')), ['shortcuts']);
      assert.deepEqual(Array.from(parseFilters('navigation')), ['navigation']);
      assert.deepEqual(Array.from(parseFilters('navigational')), ['navigation']);
      assert.deepEqual(Array.from(parseFilters('shortcuts, navigation')), ['shortcuts', 'navigation']);
    });

    it('supports boolean attribute flags', () => {
      assert.equal(parseFilters(null, { all: true }).has('all'), true);
      assert.deepEqual(Array.from(parseFilters(null, { shortcuts: true })), ['shortcuts']);
      assert.deepEqual(Array.from(parseFilters(null, { navigation: true })), ['navigation']);
    });
  });

  describe('formatKeystrokeEvent() - prompt examples & platform support', () => {
    it('shows "→" when hitting the right arrow key', () => {
      const res = formatKeystrokeEvent(
        { key: 'ArrowRight', code: 'ArrowRight' },
        { platform: 'mac', filters: parseFilters('shortcuts, navigation') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isNavigation, true);
      assert.equal(res.label, '→');
      assert.deepEqual(res.keys, [{ label: '→', type: 'primary' }]);
    });

    it('shows "SHIFT + TAB" when hitting TAB while holding SHIFT', () => {
      const res = formatKeystrokeEvent(
        { key: 'Tab', code: 'Tab', shiftKey: true },
        { platform: 'mac', filters: parseFilters('shortcuts, navigation') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.isNavigation, true);
      assert.equal(res.label, 'SHIFT + TAB');
      assert.deepEqual(res.keys, [
        { label: 'SHIFT', type: 'modifier' },
        { label: 'TAB', type: 'primary' },
      ]);
    });

    it('shows "CMD + A" when hitting A while holding CMD on macOS', () => {
      const res = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA', metaKey: true },
        { platform: 'mac', filters: parseFilters('shortcuts, navigation') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.label, 'CMD + A');
      assert.deepEqual(res.keys, [
        { label: 'CMD', type: 'modifier' },
        { label: 'A', type: 'primary' },
      ]);
    });

    it('shows "CTRL + A" when hitting A while holding CTRL on Windows', () => {
      const res = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA', ctrlKey: true },
        { platform: 'windows', filters: parseFilters('shortcuts, navigation') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.label, 'CTRL + A');
      assert.deepEqual(res.keys, [
        { label: 'CTRL', type: 'modifier' },
        { label: 'A', type: 'primary' },
      ]);
    });

    it('shows "SHIFT + CMD + T" when hitting T while holding SHIFT and CMD on macOS', () => {
      const res = formatKeystrokeEvent(
        { key: 'T', code: 'KeyT', shiftKey: true, metaKey: true },
        { platform: 'mac', filters: parseFilters('shortcuts') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.label, 'SHIFT + CMD + T');
    });

    it('shows "SHIFT + ENTER" as a shortcut', () => {
      const res = formatKeystrokeEvent(
        { key: 'Enter', code: 'Enter', shiftKey: true },
        { platform: 'mac', filters: parseFilters('shortcuts') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.label, 'SHIFT + ENTER');
    });

    it('filters out plain character typing by default ("shortcuts, navigation"), but allows it in "all" mode', () => {
      const defaultRes = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA' },
        { platform: 'mac', filters: parseFilters('shortcuts, navigation') }
      );
      assert.equal(defaultRes.shouldShow, false);

      const allRes = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA' },
        { platform: 'mac', filters: parseFilters('all') }
      );
      assert.equal(allRes.shouldShow, true);
      assert.equal(allRes.label, 'A');
    });

    it('filters out navigation keys when filter="shortcuts" only, and filters out shortcuts when filter="navigation" only', () => {
      const arrowInShortcutsOnly = formatKeystrokeEvent(
        { key: 'ArrowRight', code: 'ArrowRight' },
        { platform: 'mac', filters: parseFilters('shortcuts') }
      );
      assert.equal(arrowInShortcutsOnly.shouldShow, false);

      const cmdAInNavOnly = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA', metaKey: true },
        { platform: 'mac', filters: parseFilters('navigation') }
      );
      assert.equal(cmdAInNavOnly.shouldShow, false);
    });

    it('ignores lone modifier presses', () => {
      const modRes = formatKeystrokeEvent(
        { key: 'Meta', code: 'MetaLeft', metaKey: true },
        { platform: 'mac', filters: parseFilters('all') }
      );
      assert.equal(modRes.shouldShow, false);
      assert.equal(modRes.isModifierOnly, true);
    });

    it('captures BACKSPACE, SPACE, DELETE, and F1–F15 in default ("shortcuts, navigation") mode and labels SPACE as "SPACE"', () => {
      const defaultFilters = parseFilters('shortcuts, navigation');

      const backspaceRes = formatKeystrokeEvent(
        { key: 'Backspace', code: 'Backspace' },
        { platform: 'mac', filters: defaultFilters }
      );
      assert.equal(backspaceRes.shouldShow, true);
      assert.equal(backspaceRes.label, 'BACKSPACE');

      const spaceRes = formatKeystrokeEvent(
        { key: ' ', code: 'Space' },
        { platform: 'mac', filters: defaultFilters }
      );
      assert.equal(spaceRes.shouldShow, true);
      assert.equal(spaceRes.label, 'SPACE');

      const nbspSpaceRes = formatKeystrokeEvent(
        { key: '\u00A0', code: 'Space' },
        { platform: 'mac', filters: defaultFilters }
      );
      assert.equal(nbspSpaceRes.shouldShow, true);
      assert.equal(nbspSpaceRes.label, 'SPACE');

      const deleteRes = formatKeystrokeEvent(
        { key: 'Delete', code: 'Delete' },
        { platform: 'mac', filters: defaultFilters }
      );
      assert.equal(deleteRes.shouldShow, true);
      assert.equal(deleteRes.label, 'DELETE');

      for (let i = 1; i <= 15; i++) {
        const fnKey = `F${i}`;
        const fnRes = formatKeystrokeEvent(
          { key: fnKey, code: fnKey },
          { platform: 'mac', filters: defaultFilters }
        );
        assert.equal(fnRes.shouldShow, true, `${fnKey} should be captured`);
        assert.equal(fnRes.label, fnKey);
      }
    });
  });

  describe('parseKeystrokeString()', () => {
    it('parses static keystroke strings into modifier and primary key objects', () => {
      assert.deepEqual(parseKeystrokeString('SHIFT + TAB'), {
        keys: [
          { label: 'SHIFT', type: 'modifier' },
          { label: 'TAB', type: 'primary' },
        ],
        label: 'SHIFT + TAB',
      });

      assert.deepEqual(parseKeystrokeString('→'), {
        keys: [{ label: '→', type: 'primary' }],
        label: '→',
      });
    });
  });

  describe('parsePosition()', () => {
    it('parses all 9 valid combinations of top/center/bottom and left/center/right', () => {
      const verticals = ['top', 'center', 'bottom'];
      const horizontals = ['left', 'center', 'right'];

      for (const v of verticals) {
        for (const h of horizontals) {
          assert.deepEqual(parsePosition(`${v} ${h}`), {
            vertical: v,
            horizontal: h,
            value: `${v} ${h}`,
          });
        }
      }
    });

    it('normalizes reversed token order (e.g. "right top" -> "top right") and case/whitespace', () => {
      assert.deepEqual(parsePosition('right top'), {
        vertical: 'top',
        horizontal: 'right',
        value: 'top right',
      });
      assert.deepEqual(parsePosition('  LEFT   BOTTOM '), {
        vertical: 'bottom',
        horizontal: 'left',
        value: 'bottom left',
      });
    });

    it('supports leading pointer and mouse keywords and defaults to bottom right when omitted', () => {
      assert.deepEqual(parsePosition('pointer'), {
        vertical: 'bottom',
        horizontal: 'right',
        pointer: true,
        positionArea: 'bottom right',
        value: 'pointer bottom right',
      });
      assert.deepEqual(parsePosition('mouse'), {
        vertical: 'bottom',
        horizontal: 'right',
        pointer: true,
        positionArea: 'bottom right',
        value: 'mouse bottom right',
      });
      assert.deepEqual(parsePosition('mouse top right'), {
        vertical: 'top',
        horizontal: 'right',
        pointer: true,
        positionArea: 'top right',
        value: 'mouse top right',
      });
      assert.deepEqual(parsePosition('pointer right top'), {
        vertical: 'top',
        horizontal: 'right',
        pointer: true,
        positionArea: 'top right',
        value: 'pointer top right',
      });
    });

    it('returns null for invalid or incomplete position values', () => {
      assert.equal(parsePosition(null), null);
      assert.equal(parsePosition(''), null);
      assert.equal(parsePosition('top'), null);
      assert.equal(parsePosition('mouse top'), null);
      assert.equal(parsePosition('top bottom'), null);
      assert.equal(parsePosition('left right'), null);
      assert.equal(parsePosition('top right extra'), null);
    });
  });

  describe('parseDurationMs() & timeout/fade-out defaults', () => {
    it('exports sensible default values in milliseconds (1500ms timeout, 300ms fade-out)', () => {
      assert.equal(DEFAULT_TIMEOUT, 1500);
      assert.equal(DEFAULT_FADE_DURATION, 300);
      assert.equal(parseDurationMs(undefined, DEFAULT_TIMEOUT), 1500);
      assert.equal(parseDurationMs(null, DEFAULT_FADE_DURATION), 300);
      assert.equal(parseDurationMs('', DEFAULT_TIMEOUT), 1500);
    });

    it('parses custom millisecond numbers and numeric strings', () => {
      assert.equal(parseDurationMs(2500, DEFAULT_TIMEOUT), 2500);
      assert.equal(parseDurationMs('500', DEFAULT_FADE_DURATION), 500);
      assert.equal(parseDurationMs('0', DEFAULT_TIMEOUT), 0);
    });

    it('falls back to defaultValue for negative or non-numeric inputs', () => {
      assert.equal(parseDurationMs(-100, DEFAULT_TIMEOUT), 1500);
      assert.equal(parseDurationMs('invalid', DEFAULT_FADE_DURATION), 300);
    });
  });

  describe('parseSize()', () => {
    it('defaults to "large" and validates small, medium, large, x-large, xx-large', () => {
      assert.equal(DEFAULT_SIZE, 'large');
      assert.equal(parseSize('small'), 'small');
      assert.equal(parseSize('medium'), 'medium');
      assert.equal(parseSize('large'), 'large');
      assert.equal(parseSize('x-large'), 'x-large');
      assert.equal(parseSize('xx-large'), 'xx-large');
      assert.equal(parseSize('  XX-LARGE '), 'xx-large');
    });

    it('returns null for omitted or invalid size values', () => {
      assert.equal(parseSize(null), null);
      assert.equal(parseSize(''), null);
      assert.equal(parseSize('xxx-large'), null);
    });
  });
});




import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_KEYSTROKES,
  DEFAULT_HIDE_DELAY,
  DEFAULT_HIDE_DURATION,
  DEFAULT_SIZE,
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
} from '../../src/js/show-keystrokes/utils/keystroke.js';

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

  describe('parseKeystrokes()', () => {
    it('defaults to shortcuts and navigational when omitted or empty (no value)', () => {
      const keystrokesSet = parseKeystrokes(undefined);
      assert.deepEqual(Array.from(keystrokesSet), DEFAULT_KEYSTROKES);
      assert.deepEqual(Array.from(parseKeystrokes('')), DEFAULT_KEYSTROKES);
      assert.equal(keystrokesSet.has('shortcuts'), true);
      assert.equal(keystrokesSet.has('navigational'), true);
      assert.equal(keystrokesSet.has('all'), false);
    });

    it('parses "all", "shortcuts", "navigational", and "none" configurations', () => {
      assert.equal(parseKeystrokes('all').has('all'), true);
      assert.deepEqual(Array.from(parseKeystrokes('shortcuts')), ['shortcuts']);
      assert.deepEqual(Array.from(parseKeystrokes('navigational')), ['navigational']);
      assert.deepEqual(Array.from(parseKeystrokes('navigation')), ['navigational']);
      assert.deepEqual(Array.from(parseKeystrokes('shortcuts, navigational')), ['shortcuts', 'navigational']);
      assert.deepEqual(Array.from(parseKeystrokes('none')), []);
    });

    it('supports boolean attribute flags', () => {
      assert.equal(parseKeystrokes(null, { all: true }).has('all'), true);
      assert.deepEqual(Array.from(parseKeystrokes(null, { shortcuts: true })), ['shortcuts']);
      assert.deepEqual(Array.from(parseKeystrokes(null, { navigational: true })), ['navigational']);
    });
  });

  describe('formatKeystrokeEvent() - prompt examples & platform support', () => {
    it('shows "→" when hitting the right arrow key', () => {
      const res = formatKeystrokeEvent(
        { key: 'ArrowRight', code: 'ArrowRight' },
        { platform: 'mac', keystrokes: parseKeystrokes('') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isNavigation, true);
      assert.equal(res.label, '→');
      assert.deepEqual(res.keys, [{ label: '→', type: 'primary' }]);
    });

    it('shows "SHIFT + TAB" when hitting TAB while holding SHIFT', () => {
      const res = formatKeystrokeEvent(
        { key: 'Tab', code: 'Tab', shiftKey: true },
        { platform: 'mac', keystrokes: parseKeystrokes('') }
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
        { platform: 'mac', keystrokes: parseKeystrokes('') }
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
        { platform: 'windows', keystrokes: parseKeystrokes('') }
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
        { platform: 'mac', keystrokes: parseKeystrokes('shortcuts') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.label, 'SHIFT + CMD + T');
    });

    it('shows "SHIFT + ENTER" as a shortcut', () => {
      const res = formatKeystrokeEvent(
        { key: 'Enter', code: 'Enter', shiftKey: true },
        { platform: 'mac', keystrokes: parseKeystrokes('shortcuts') }
      );
      assert.equal(res.shouldShow, true);
      assert.equal(res.isShortcut, true);
      assert.equal(res.label, 'SHIFT + ENTER');
    });

    it('ignores plain character typing by default (no value), allows it in "all", and shows nothing in "none"', () => {
      const defaultRes = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA' },
        { platform: 'mac', keystrokes: parseKeystrokes('') }
      );
      assert.equal(defaultRes.shouldShow, false);

      const allRes = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA' },
        { platform: 'mac', keystrokes: parseKeystrokes('all') }
      );
      assert.equal(allRes.shouldShow, true);
      assert.equal(allRes.label, 'A');

      const noneRes = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA', metaKey: true },
        { platform: 'mac', keystrokes: parseKeystrokes('none') }
      );
      assert.equal(noneRes.shouldShow, false);
    });

    it('shows only shortcuts when keystrokes="shortcuts" and only navigational keys when keystrokes="navigational"', () => {
      const arrowInShortcutsOnly = formatKeystrokeEvent(
        { key: 'ArrowRight', code: 'ArrowRight' },
        { platform: 'mac', keystrokes: parseKeystrokes('shortcuts') }
      );
      assert.equal(arrowInShortcutsOnly.shouldShow, false);

      const cmdAInNavOnly = formatKeystrokeEvent(
        { key: 'a', code: 'KeyA', metaKey: true },
        { platform: 'mac', keystrokes: parseKeystrokes('navigational') }
      );
      assert.equal(cmdAInNavOnly.shouldShow, false);
    });

    it('ignores lone modifier presses', () => {
      const modRes = formatKeystrokeEvent(
        { key: 'Meta', code: 'MetaLeft', metaKey: true },
        { platform: 'mac', keystrokes: parseKeystrokes('all') }
      );
      assert.equal(modRes.shouldShow, false);
      assert.equal(modRes.isModifierOnly, true);
    });

    it('captures BACKSPACE, SPACE, DELETE, and F1–F15 in default (no value) mode and labels SPACE as "SPACE"', () => {
      const defaultKeystrokes = parseKeystrokes('');

      const backspaceRes = formatKeystrokeEvent(
        { key: 'Backspace', code: 'Backspace' },
        { platform: 'mac', keystrokes: defaultKeystrokes }
      );
      assert.equal(backspaceRes.shouldShow, true);
      assert.equal(backspaceRes.label, 'BACKSPACE');

      const spaceRes = formatKeystrokeEvent(
        { key: ' ', code: 'Space' },
        { platform: 'mac', keystrokes: defaultKeystrokes }
      );
      assert.equal(spaceRes.shouldShow, true);
      assert.equal(spaceRes.label, 'SPACE');

      const nbspSpaceRes = formatKeystrokeEvent(
        { key: '\u00A0', code: 'Space' },
        { platform: 'mac', keystrokes: defaultKeystrokes }
      );
      assert.equal(nbspSpaceRes.shouldShow, true);
      assert.equal(nbspSpaceRes.label, 'SPACE');

      const deleteRes = formatKeystrokeEvent(
        { key: 'Delete', code: 'Delete' },
        { platform: 'mac', keystrokes: defaultKeystrokes }
      );
      assert.equal(deleteRes.shouldShow, true);
      assert.equal(deleteRes.label, 'DELETE');

      for (let i = 1; i <= 15; i++) {
        const fnKey = `F${i}`;
        const fnRes = formatKeystrokeEvent(
          { key: fnKey, code: fnKey },
          { platform: 'mac', keystrokes: defaultKeystrokes }
        );
        assert.equal(fnRes.shouldShow, true, `${fnKey} should be captured`);
        assert.equal(fnRes.label, fnKey);
      }
    });

    it('supports Fn modifier via getModifierState("Fn") or fnKey and ignores lone Fn presses', () => {
      const loneFn = formatKeystrokeEvent(
        { key: 'Fn', code: 'Fn' },
        { platform: 'mac', keystrokes: parseKeystrokes('all') }
      );
      assert.equal(loneFn.shouldShow, false);
      assert.equal(loneFn.isModifierOnly, true);

      const fnF1 = formatKeystrokeEvent(
        {
          key: 'F1',
          code: 'F1',
          getModifierState: (mod) => mod === 'Fn',
        },
        { platform: 'mac', keystrokes: parseKeystrokes('') }
      );
      assert.equal(fnF1.shouldShow, true);
      assert.equal(fnF1.isShortcut, true);
      assert.equal(fnF1.label, 'FN + F1');
      assert.deepEqual(fnF1.keys, [
        { label: 'FN', type: 'modifier' },
        { label: 'F1', type: 'primary' },
      ]);
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

      assert.deepEqual(parseKeystrokeString('FN + F1'), {
        keys: [
          { label: 'FN', type: 'modifier' },
          { label: 'F1', type: 'primary' },
        ],
        label: 'FN + F1',
      });

      assert.deepEqual(parseKeystrokeString('→'), {
        keys: [{ label: '→', type: 'primary' }],
        label: '→',
      });
    });
  });

  describe('parsePosition()', () => {
    it('parses "normal" position', () => {
      assert.deepEqual(parsePosition('normal'), {
        anchor: 'normal',
        normal: true,
        value: 'normal',
      });
    });

    it('parses all 9 valid combinations of top/center/bottom and left/center/right', () => {
      const verticals = ['top', 'center', 'bottom'];
      const horizontals = ['left', 'center', 'right'];

      for (const v of verticals) {
        for (const h of horizontals) {
          assert.deepEqual(parsePosition(`${v} ${h}`), {
            anchor: 'viewport',
            vertical: v,
            horizontal: h,
            positionArea: `${v} ${h}`,
            value: `${v} ${h}`,
          });
        }
      }
    });

    it('normalizes reversed token order (e.g. "right top" -> "top right") and case/whitespace', () => {
      assert.deepEqual(parsePosition('right top'), {
        anchor: 'viewport',
        vertical: 'top',
        horizontal: 'right',
        positionArea: 'top right',
        value: 'top right',
      });
      assert.deepEqual(parsePosition('  LEFT   BOTTOM '), {
        anchor: 'viewport',
        vertical: 'bottom',
        horizontal: 'left',
        positionArea: 'bottom left',
        value: 'bottom left',
      });
    });

    it('supports leading viewport and pointer keywords and defaults to top right for viewport / bottom right for pointer when area is omitted', () => {
      assert.deepEqual(parsePosition('viewport'), {
        anchor: 'viewport',
        vertical: 'top',
        horizontal: 'right',
        positionArea: 'top right',
        value: 'viewport top right',
      });
      assert.deepEqual(parsePosition('viewport top right'), {
        anchor: 'viewport',
        vertical: 'top',
        horizontal: 'right',
        positionArea: 'top right',
        value: 'viewport top right',
      });
      assert.deepEqual(parsePosition('pointer'), {
        anchor: 'pointer',
        vertical: 'bottom',
        horizontal: 'right',
        pointer: true,
        positionArea: 'bottom right',
        value: 'pointer bottom right',
      });
      assert.deepEqual(parsePosition('pointer right top'), {
        anchor: 'pointer',
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
      assert.equal(parsePosition('pointer top'), null);
      assert.equal(parsePosition('top bottom'), null);
      assert.equal(parsePosition('left right'), null);
      assert.equal(parsePosition('top right extra'), null);
    });
  });

  describe('parseDurationMs() & hide-delay/hide-duration defaults', () => {
    it('exports sensible default values in milliseconds (1250ms hide-delay, 200ms hide-duration)', () => {
      assert.equal(DEFAULT_HIDE_DELAY, 1250);
      assert.equal(DEFAULT_HIDE_DURATION, 200);
      assert.equal(parseDurationMs(undefined, DEFAULT_HIDE_DELAY), 1250);
      assert.equal(parseDurationMs(null, DEFAULT_HIDE_DURATION), 200);
      assert.equal(parseDurationMs('', DEFAULT_HIDE_DELAY), 1250);
    });

    it('parses custom millisecond numbers and numeric strings', () => {
      assert.equal(parseDurationMs(2500, DEFAULT_HIDE_DELAY), 2500);
      assert.equal(parseDurationMs('500', DEFAULT_HIDE_DURATION), 500);
      assert.equal(parseDurationMs('0', DEFAULT_HIDE_DELAY), 0);
    });

    it('falls back to defaultValue for negative or non-numeric inputs', () => {
      assert.equal(parseDurationMs(-100, DEFAULT_HIDE_DELAY), 1250);
      assert.equal(parseDurationMs('invalid', DEFAULT_HIDE_DURATION), 200);
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

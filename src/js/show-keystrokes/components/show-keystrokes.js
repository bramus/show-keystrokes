/**
 * <show-keystrokes> Custom Element
 * Visualizes keystrokes, keyboard shortcuts, and navigational keys with
 * configurable filters, macOS/Windows support, and customizable themes.
 */

import {
  DEFAULT_TIMEOUT,
  DEFAULT_FADE_DURATION,
  DEFAULT_SIZE,
  detectPlatform,
  parseFilters,
  parsePosition,
  parseDurationMs,
  parseSize,
  formatKeystrokeEvent,
  parseKeystrokeString,
} from '../utils/keystroke.js';

const COMPONENT_STYLES = `
  :host {
    font-size: 1rem;

    --_key-min-size: var(--show-keystrokes-key-min-size, 2.75em);
    --_key-radius: var(--show-keystrokes-key-radius, 0.5em);
    --_key-padding: var(--show-keystrokes-key-padding, 0 0.65em);
    --_key-font-family: var(--show-keystrokes-key-font-family, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Segoe UI", Roboto, sans-serif);
    --_key-font-size: var(--show-keystrokes-key-font-size, 0.875em);
    --_key-font-weight: var(--show-keystrokes-key-font-weight, 600);
    --_gap: var(--show-keystrokes-gap, 0.375em);
    --_position-offset: var(--show-keystrokes-position-offset, 1rem);
    --_fade-duration: var(--show-keystrokes-fade-duration, ${DEFAULT_FADE_DURATION}ms);

    /* Default Theme: Apple Keyboard (Light & Dark via light-dark()) */
    color-scheme: light dark;

    --_apple-bg-light: linear-gradient(180deg, #ffffff 0%, #f7f7fa 100%);
    --_apple-bg-dark: linear-gradient(180deg, #262629 0%, #161618 100%);
    --_apple-color-light: #515154;
    --_apple-color-dark: #d1d1d6;
    --_apple-border-light: #d2d2d7;
    --_apple-border-dark: #3a3a3c;
    --_apple-shadow-light: 0 2px 0 0 #c7c7cc, 0 3px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 #ffffff;
    --_apple-shadow-dark: 0 2px 0 0 #000000, 0 4px 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    --_apple-sep-light: #86868b;
    --_apple-sep-dark: #98989d;

    --_key-bg: var(--show-keystrokes-key-bg, light-dark(#ffffff, #1c1c1e));
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_apple-bg-light));
    --_key-color: var(--show-keystrokes-key-color, light-dark(var(--_apple-color-light), var(--_apple-color-dark)));
    --_key-border: var(--show-keystrokes-key-border, 1px solid light-dark(var(--_apple-border-light), var(--_apple-border-dark)));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_apple-shadow-light));
    --_modifier-bg: var(--show-keystrokes-modifier-bg, var(--_key-bg));
    --_modifier-bg-image: var(--show-keystrokes-modifier-bg-image, var(--_key-bg-image));
    --_modifier-color: var(--show-keystrokes-modifier-color, var(--_key-color));
    --_separator-color: var(--show-keystrokes-separator-color, light-dark(var(--_apple-sep-light), var(--_apple-sep-dark)));

    display: inline-flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    width: max-content;
    flex-shrink: 0;
    vertical-align: middle;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
  }

  :host([hidden]) {
    display: none !important;
  }

  /* ==========================================================================
   * SIZES (size="small" | "medium" | "large" | "x-large" | "xx-large")
   * Changes the base font-size of the component; all key metrics scale via em.
   * ========================================================================== */
  :host([size="small" i]) {
    font-size: 0.6875rem;
  }

  :host([size="medium" i]) {
    font-size: 0.8125rem;
  }

  :host([size="large" i]) {
    font-size: 1rem;
  }

  :host([size="x-large" i]) {
    font-size: 1.25rem;
  }

  :host([size="xx-large" i]) {
    font-size: 1.5rem;
  }

  /* ==========================================================================
   * VIEWPORT POSITIONING (position="<top|center|bottom> <left|center|right>")
   * Fixes the component in the viewport with a 1rem gap (--show-keystrokes-position-offset)
   * ========================================================================== */
  :host([position~="top" i][position~="left" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: var(--_position-offset);
    bottom: auto;
    left: var(--_position-offset);
    right: auto;
    translate: none;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="top" i][position~="center" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: var(--_position-offset);
    bottom: auto;
    left: 50%;
    right: auto;
    translate: -50% 0;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="top" i][position~="right" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: var(--_position-offset);
    bottom: auto;
    left: auto;
    right: var(--_position-offset);
    translate: none;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="center" i][position~="left" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: 50%;
    bottom: auto;
    left: var(--_position-offset);
    right: auto;
    translate: 0 -50%;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position="center center" i]) {
    position: fixed;
    top: 50%;
    bottom: auto;
    left: 50%;
    right: auto;
    translate: -50% -50%;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="center" i][position~="right" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: 50%;
    bottom: auto;
    left: auto;
    right: var(--_position-offset);
    translate: 0 -50%;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="bottom" i][position~="left" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: auto;
    bottom: var(--_position-offset);
    left: var(--_position-offset);
    right: auto;
    translate: none;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="bottom" i][position~="center" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: auto;
    bottom: var(--_position-offset);
    left: 50%;
    right: auto;
    translate: -50% 0;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="bottom" i][position~="right" i]:not([position~="pointer" i]):not([position~="mouse" i])) {
    position: fixed;
    top: auto;
    bottom: var(--_position-offset);
    left: auto;
    right: var(--_position-offset);
    translate: none;
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  /* ==========================================================================
   * POINTER / MOUSE ANCHOR POSITIONING
   * (position="pointer|mouse [<top|center|bottom> <left|center|right>]")
   * Anchors <show-keystrokes> to the invisible #show-keystrokes-anchor tracking the pointer
   * using CSS Anchor Positioning (position-area & position-try-fallbacks).
   * ========================================================================== */
  :host([position~="pointer" i]),
  :host([position~="mouse" i]) {
    position: fixed;
    inset: auto;
    translate: none;
    position-anchor: --show-keystrokes-anchor;
    position-area: bottom right;
    position-try-fallbacks: none;
    position-visibility: always;
    margin: var(--show-keystrokes-pointer-gap, 0.25rem);
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  :host([position~="pointer" i][active]),
  :host([position~="mouse" i][active]) {
    position-try-fallbacks: flip-inline, flip-block, flip-inline flip-block;
  }

  :host([position~="pointer" i][position~="top" i][position~="left" i]),
  :host([position~="mouse" i][position~="top" i][position~="left" i]) {
    position-area: top left;
  }

  :host([position~="pointer" i][position~="top" i][position~="center" i]),
  :host([position~="mouse" i][position~="top" i][position~="center" i]) {
    position-area: top center;
  }

  :host([position~="pointer" i][position~="top" i][position~="right" i]),
  :host([position~="mouse" i][position~="top" i][position~="right" i]) {
    position-area: top right;
  }

  :host([position~="pointer" i][position~="center" i][position~="left" i]),
  :host([position~="mouse" i][position~="center" i][position~="left" i]) {
    position-area: center left;
  }

  :host([position="pointer center center" i]),
  :host([position="mouse center center" i]) {
    position-area: center center;
  }

  :host([position~="pointer" i][position~="center" i][position~="right" i]),
  :host([position~="mouse" i][position~="center" i][position~="right" i]) {
    position-area: center right;
  }

  :host([position~="pointer" i][position~="bottom" i][position~="left" i]),
  :host([position~="mouse" i][position~="bottom" i][position~="left" i]) {
    position-area: bottom left;
  }

  :host([position~="pointer" i][position~="bottom" i][position~="center" i]),
  :host([position~="mouse" i][position~="bottom" i][position~="center" i]) {
    position-area: bottom center;
  }

  :host([position~="pointer" i][position~="bottom" i][position~="right" i]),
  :host([position~="mouse" i][position~="bottom" i][position~="right" i]) {
    position-area: bottom right;
  }

  /* Color scheme overrides via attribute */
  :host([color-scheme="light"]),
  :host([variant="light"]),
  :host([theme$="-light"]) {
    color-scheme: light;
    --_key-bg: var(--show-keystrokes-key-bg, #ffffff);
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_apple-bg-light));
    --_key-color: var(--show-keystrokes-key-color, var(--_apple-color-light));
    --_key-border: var(--show-keystrokes-key-border, 1px solid var(--_apple-border-light));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_apple-shadow-light));
    --_separator-color: var(--show-keystrokes-separator-color, var(--_apple-sep-light));
  }

  :host([color-scheme="dark"]),
  :host([variant="dark"]),
  :host([theme$="-dark"]) {
    color-scheme: dark;
    --_key-bg: var(--show-keystrokes-key-bg, #1c1c1e);
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_apple-bg-dark));
    --_key-color: var(--show-keystrokes-key-color, var(--_apple-color-dark));
    --_key-border: var(--show-keystrokes-key-border, 1px solid var(--_apple-border-dark));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_apple-shadow-dark));
    --_separator-color: var(--show-keystrokes-separator-color, var(--_apple-sep-dark));
  }

  @media (prefers-color-scheme: dark) {
    :host(:not([color-scheme="light"]):not([variant="light"]):not([theme$="-light"])) {
      --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_apple-bg-dark));
      --_key-shadow: var(--show-keystrokes-key-shadow, var(--_apple-shadow-dark));
    }
  }

  /* ==========================================================================
   * THEME 2: Mechanical Keyboard ("mechanical" / "classic")
   * Sculpted spherical dish profile, monospace legends, tactile keywell depth
   * ========================================================================== */
  :host([theme="mechanical"]),
  :host([theme="mechanical-light"]),
  :host([theme="mechanical-dark"]),
  :host([theme="classic"]),
  :host([theme="classic-light"]),
  :host([theme="classic-dark"]) {
    --_mech-bg-light: linear-gradient(180deg, #f6f4ee 0%, #e6e1d5 100%);
    --_mech-bg-dark: linear-gradient(180deg, #30363d 0%, #21262d 100%);
    --_mech-mod-bg-light: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
    --_mech-mod-bg-dark: linear-gradient(180deg, #3730a3 0%, #2e2a7b 100%);
    --_mech-color-light: #1e293b;
    --_mech-color-dark: #e2e8f0;
    --_mech-mod-color-light: #0f172a;
    --_mech-mod-color-dark: #e0e7ff;
    --_mech-border-light: #b8b1a1;
    --_mech-border-dark: #484f58;
    --_mech-shadow-light: inset 0 -4px 0 #cfc8b8, inset 0 1px 0 #ffffff, 0 3px 0 #948c7d, 0 5px 10px rgba(0, 0, 0, 0.15);
    --_mech-shadow-dark: inset 0 -4px 0 #161b22, inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 3px 0 #090c10, 0 6px 12px rgba(0, 0, 0, 0.55);

    --_key-radius: var(--show-keystrokes-key-radius, 0.4375em);
    --_key-font-family: var(--show-keystrokes-key-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
    --_key-bg: var(--show-keystrokes-key-bg, light-dark(#f1ede4, #282e36));
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_mech-bg-light));
    --_key-color: var(--show-keystrokes-key-color, light-dark(var(--_mech-color-light), var(--_mech-color-dark)));
    --_key-border: var(--show-keystrokes-key-border, 1px solid light-dark(var(--_mech-border-light), var(--_mech-border-dark)));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_mech-shadow-light));
    --_modifier-bg: var(--show-keystrokes-modifier-bg, light-dark(#dbe2ea, #312e81));
    --_modifier-bg-image: var(--show-keystrokes-modifier-bg-image, var(--_mech-mod-bg-light));
    --_modifier-color: var(--show-keystrokes-modifier-color, light-dark(var(--_mech-mod-color-light), var(--_mech-mod-color-dark)));
  }

  :host([theme="mechanical"][color-scheme="dark"]),
  :host([theme="mechanical"][variant="dark"]),
  :host([theme="mechanical-dark"]),
  :host([theme="classic"][color-scheme="dark"]),
  :host([theme="classic"][variant="dark"]),
  :host([theme="classic-dark"]) {
    --_key-bg: var(--show-keystrokes-key-bg, #282e36);
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_mech-bg-dark));
    --_key-color: var(--show-keystrokes-key-color, var(--_mech-color-dark));
    --_key-border: var(--show-keystrokes-key-border, 1px solid var(--_mech-border-dark));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_mech-shadow-dark));
    --_modifier-bg: var(--show-keystrokes-modifier-bg, #312e81);
    --_modifier-bg-image: var(--show-keystrokes-modifier-bg-image, var(--_mech-mod-bg-dark));
    --_modifier-color: var(--show-keystrokes-modifier-color, var(--_mech-mod-color-dark));
  }

  :host([theme="mechanical"][color-scheme="light"]),
  :host([theme="mechanical"][variant="light"]),
  :host([theme="mechanical-light"]),
  :host([theme="classic"][color-scheme="light"]),
  :host([theme="classic"][variant="light"]),
  :host([theme="classic-light"]) {
    --_key-bg: var(--show-keystrokes-key-bg, #f1ede4);
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_mech-bg-light));
    --_key-color: var(--show-keystrokes-key-color, var(--_mech-color-light));
    --_key-border: var(--show-keystrokes-key-border, 1px solid var(--_mech-border-light));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_mech-shadow-light));
    --_modifier-bg: var(--show-keystrokes-modifier-bg, #dbe2ea);
    --_modifier-bg-image: var(--show-keystrokes-modifier-bg-image, var(--_mech-mod-bg-light));
    --_modifier-color: var(--show-keystrokes-modifier-color, var(--_mech-mod-color-light));
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="mechanical"]:not([color-scheme="light"]):not([variant="light"])),
    :host([theme="classic"]:not([color-scheme="light"]):not([variant="light"])) {
      --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_mech-bg-dark));
      --_key-shadow: var(--show-keystrokes-key-shadow, var(--_mech-shadow-dark));
      --_modifier-bg-image: var(--show-keystrokes-modifier-bg-image, var(--_mech-mod-bg-dark));
    }
  }

  .container {
    display: inline-flex;
    flex-wrap: nowrap;
    white-space: nowrap;
    width: max-content;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    gap: var(--_gap);
    box-sizing: border-box;
    min-height: var(--_key-min-size);
    transition: opacity var(--_fade-duration) ease, transform var(--_fade-duration) ease;
  }

  .container.is-empty {
    min-height: 0;
  }

  .container.is-fading {
    opacity: 0;
    transform: translateY(2px);
  }

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    min-width: var(--_key-min-size);
    height: var(--_key-min-size);
    padding: var(--_key-padding);
    border-radius: var(--_key-radius);
    border: var(--_key-border);
    background-color: var(--_key-bg);
    background-image: var(--_key-bg-image);
    color: var(--_key-color);
    box-shadow: var(--_key-shadow);
    font-family: var(--_key-font-family);
    font-size: var(--_key-font-size);
    font-weight: var(--_key-font-weight);
    line-height: 1;
    letter-spacing: 0.02em;
    white-space: nowrap;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }

  /* Single-character and arrow keys form true rounded squares */
  .key.is-square {
    width: var(--_key-min-size);
    padding: 0;
    font-size: calc(var(--_key-font-size) * 1.08);
  }

  .key.is-arrow {
    font-size: calc(var(--_key-font-size) * 1.25);
    font-weight: 500;
  }

  .key.is-modifier {
    min-width: calc(var(--_key-min-size) * 1.25);
    padding: 0 0.75em;
    background-color: var(--_modifier-bg);
    background-image: var(--_modifier-bg-image);
    color: var(--_modifier-color);
  }

  :host([pressed]) .key {
    transform: translateY(1px);
  }

  .separator {
    display: var(--show-keystrokes-separator-display, inline-flex);
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    white-space: nowrap;
    color: var(--_separator-color);
    font-family: var(--_key-font-family);
    font-size: var(--show-keystrokes-separator-size, 0.875em);
    font-weight: 600;
    padding: 0 0.1em;
    line-height: 1;
  }
`;

const KEYSTROKE_ANCHOR_ID = 'show-keystrokes-anchor';
const KEYSTROKE_ANCHOR_STYLE_ID = 'show-keystrokes-anchor-styles';

const KEYSTROKE_ANCHOR_STYLES = `
  #${KEYSTROKE_ANCHOR_ID} {
    position: fixed;
    top: var(--show-keystrokes-pointer-y, 50vh);
    left: var(--show-keystrokes-pointer-x, 50vw);
    width: var(--show-keystrokes-anchor-size, 1.25rem);
    height: var(--show-keystrokes-anchor-size, 1.25rem);
    translate: -50% -50%;
    pointer-events: none;
    opacity: 0;
    z-index: -1;
    anchor-name: --show-keystrokes-anchor;
  }

  show-keystrokes[position~="pointer" i],
  show-keystrokes[position~="mouse" i] {
    position: fixed;
    inset: auto;
    translate: none;
    width: max-content;
    white-space: nowrap;
    position-anchor: --show-keystrokes-anchor;
    position-area: bottom right;
    position-try-fallbacks: none;
    position-visibility: always;
    margin: var(--show-keystrokes-pointer-gap, 0.25rem);
    z-index: var(--show-keystrokes-z-index, 9999);
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  show-keystrokes[position~="pointer" i][active],
  show-keystrokes[position~="mouse" i][active] {
    position-try-fallbacks: flip-inline, flip-block, flip-inline flip-block;
  }

  show-keystrokes[position~="pointer" i][position~="top" i][position~="left" i],
  show-keystrokes[position~="mouse" i][position~="top" i][position~="left" i] {
    position-area: top left;
  }

  show-keystrokes[position~="pointer" i][position~="top" i][position~="center" i],
  show-keystrokes[position~="mouse" i][position~="top" i][position~="center" i] {
    position-area: top center;
  }

  show-keystrokes[position~="pointer" i][position~="top" i][position~="right" i],
  show-keystrokes[position~="mouse" i][position~="top" i][position~="right" i] {
    position-area: top right;
  }

  show-keystrokes[position~="pointer" i][position~="center" i][position~="left" i],
  show-keystrokes[position~="mouse" i][position~="center" i][position~="left" i] {
    position-area: center left;
  }

  show-keystrokes[position="pointer center center" i],
  show-keystrokes[position="mouse center center" i] {
    position-area: center center;
  }

  show-keystrokes[position~="pointer" i][position~="center" i][position~="right" i],
  show-keystrokes[position~="mouse" i][position~="center" i][position~="right" i] {
    position-area: center right;
  }

  show-keystrokes[position~="pointer" i][position~="bottom" i][position~="left" i],
  show-keystrokes[position~="mouse" i][position~="bottom" i][position~="left" i] {
    position-area: bottom left;
  }

  show-keystrokes[position~="pointer" i][position~="bottom" i][position~="center" i],
  show-keystrokes[position~="mouse" i][position~="bottom" i][position~="center" i] {
    position-area: bottom center;
  }

  show-keystrokes[position~="pointer" i][position~="bottom" i][position~="right" i],
  show-keystrokes[position~="mouse" i][position~="bottom" i][position~="right" i] {
    position-area: bottom right;
  }
`;

let pointerTrackingInitialized = false;

function ensureKeystrokeAnchor() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  if (document.head && !document.getElementById(KEYSTROKE_ANCHOR_STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = KEYSTROKE_ANCHOR_STYLE_ID;
    styleEl.textContent = KEYSTROKE_ANCHOR_STYLES;
    document.head.appendChild(styleEl);
  }

  let anchorEl = document.getElementById(KEYSTROKE_ANCHOR_ID);
  if (!anchorEl && document.body) {
    anchorEl = document.createElement('div');
    anchorEl.id = KEYSTROKE_ANCHOR_ID;
    anchorEl.setAttribute('aria-hidden', 'true');
    // Prepend as the first child of document.body so it precedes all <show-keystrokes> elements in DOM tree order
    document.body.prepend(anchorEl);
  }

  if (!pointerTrackingInitialized) {
    pointerTrackingInitialized = true;

    const updatePointerAnchor = (event) => {
      if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
        return;
      }
      const el = document.getElementById(KEYSTROKE_ANCHOR_ID);
      if (el) {
        el.style.left = `${event.clientX}px`;
        el.style.top = `${event.clientY}px`;
      }
      document.documentElement?.style.setProperty('--show-keystrokes-pointer-x', `${event.clientX}px`);
      document.documentElement?.style.setProperty('--show-keystrokes-pointer-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', updatePointerAnchor, { passive: true, capture: true });
    window.addEventListener('mousemove', updatePointerAnchor, { passive: true, capture: true });
    window.addEventListener('pointerdown', updatePointerAnchor, { passive: true, capture: true });
  }

  return anchorEl;
}

export class ShowKeystrokes extends HTMLElement {
  static get observedAttributes() {
    return [
      'filter',
      'mode',
      'show',
      'all',
      'shortcuts',
      'navigation',
      'navigational',
      'theme',
      'color-scheme',
      'variant',
      'platform',
      'position',
      'size',
      'notation',
      'keys',
      'timeout',
      'hide-timeout',
      'fade-duration',
      'fade-out',
      'fadeout-duration',
      'duration',
      'static',
      'disabled',
      'target',
    ];
  }

  #container = null;
  #targetElement = null;
  #boundKeyDown = null;
  #boundKeyUp = null;
  #boundBlur = null;
  #fadeTimer = null;
  #fallbackRafId = null;
  #currentKeys = [];
  #currentLabel = '';
  #isPhysicalMac = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = COMPONENT_STYLES;

    const containerEl = document.createElement('div');
    containerEl.className = 'container is-empty';
    containerEl.setAttribute('part', 'container');
    containerEl.setAttribute('role', 'status');
    containerEl.setAttribute('aria-live', 'polite');

    this.shadowRoot.append(styleEl, containerEl);
    this.#container = containerEl;

    this.#isPhysicalMac = detectPlatform('auto') === 'mac';
    this.#boundKeyDown = this.#onKeyDown.bind(this);
    this.#boundKeyUp = this.#onKeyUp.bind(this);
    this.#boundBlur = this.#onBlur.bind(this);
  }

  connectedCallback() {
    ensureKeystrokeAnchor();

    if (!this.hasAttribute('theme')) {
      this.setAttribute('theme', 'apple');
    }

    if (this.hasAttribute('position')) {
      this.#syncPositionAttribute(this.getAttribute('position'));
    }

    if (this.hasAttribute('size')) {
      this.#syncSizeAttribute(this.getAttribute('size'));
    }

    this.#syncFadeDurationStyle();
    this.#attachListeners();

    // Check if declarative keys attribute or child text content was provided
    const initialKeys = this.getAttribute('keys') || this.textContent?.trim();
    if (initialKeys) {
      this.showKeys(initialKeys);
    } else {
      this.#render();
    }
  }

  disconnectedCallback() {
    this.#detachListeners();
    this.#clearTimer();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.isConnected) {
      return;
    }

    if (name === 'position') {
      this.#syncPositionAttribute(newValue);
      return;
    }

    if (name === 'size') {
      this.#syncSizeAttribute(newValue);
      return;
    }

    if (
      name === 'fade-duration' ||
      name === 'fade-out' ||
      name === 'fadeout-duration' ||
      name === 'duration'
    ) {
      this.#syncFadeDurationStyle();
      if (this.#currentKeys.length > 0) {
        this.#scheduleAutoClear();
      }
      return;
    }

    if (name === 'timeout' || name === 'hide-timeout') {
      if (this.#currentKeys.length > 0) {
        this.#scheduleAutoClear();
      }
      return;
    }

    if (name === 'static' || name === 'disabled' || name === 'target') {
      this.#detachListeners();
      this.#attachListeners();
    }

    if (name === 'keys') {
      if (newValue) {
        this.showKeys(newValue);
      } else {
        this.clear();
      }
      return;
    }

    if (name === 'notation' && this.#currentLabel) {
      this.showKeys(this.#currentLabel);
    }
  }

  #syncPositionAttribute(rawVal) {
    if (!rawVal) {
      return;
    }
    ensureKeystrokeAnchor();
    const parsed = parsePosition(rawVal);
    if (parsed && rawVal !== parsed.value) {
      this.setAttribute('position', parsed.value);
    }
  }

  #syncSizeAttribute(rawVal) {
    if (!rawVal) {
      return;
    }
    const parsed = parseSize(rawVal);
    if (parsed && rawVal !== parsed) {
      this.setAttribute('size', parsed);
    }
  }

  /**
   * Gets or sets the component size ('small' | 'medium' | 'large' | 'x-large' | 'xx-large').
   * Defaults to 'large'.
   * @returns {'small' | 'medium' | 'large' | 'x-large' | 'xx-large'}
   */
  get size() {
    return parseSize(this.getAttribute('size')) || DEFAULT_SIZE;
  }

  set size(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('size');
      return;
    }
    const parsed = parseSize(String(val));
    if (parsed) {
      this.setAttribute('size', parsed);
    } else {
      this.removeAttribute('size');
    }
  }

  #syncFadeDurationStyle() {
    if (!this.#container) {
      return;
    }
    this.#container.style.setProperty('--_fade-duration', `${this.fadeDuration}ms`);
  }

  /**
   * Gets or sets the timeout in milliseconds before the displayed keystroke starts fading out.
   * Defaults to 1500 (ms). Set to 0 to disable auto-hiding.
   * @returns {number}
   */
  get timeout() {
    const raw =
      this.getAttribute('timeout') ??
      this.getAttribute('hide-timeout');
    return parseDurationMs(raw, DEFAULT_TIMEOUT);
  }

  set timeout(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('timeout');
    } else {
      this.setAttribute('timeout', String(parseDurationMs(val, DEFAULT_TIMEOUT)));
    }
  }

  /**
   * Gets or sets the duration of the fade-out transition in milliseconds.
   * Defaults to 300 (ms).
   * @returns {number}
   */
  get fadeDuration() {
    const raw =
      this.getAttribute('fade-duration') ??
      this.getAttribute('fade-out') ??
      this.getAttribute('fadeout-duration') ??
      this.getAttribute('duration');
    return parseDurationMs(raw, DEFAULT_FADE_DURATION);
  }

  set fadeDuration(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('fade-duration');
    } else {
      this.setAttribute('fade-duration', String(parseDurationMs(val, DEFAULT_FADE_DURATION)));
    }
    this.#syncFadeDurationStyle();
  }

  get fadeOut() {
    return this.fadeDuration;
  }

  set fadeOut(val) {
    this.fadeDuration = val;
  }

  get duration() {
    return this.fadeDuration;
  }

  set duration(val) {
    this.fadeDuration = val;
  }

  /**
   * Gets or sets the fixed viewport or pointer position (e.g. "top right", "pointer bottom right").
   * Returns null if not set or invalid.
   * @returns {string | null}
   */
  get position() {
    const parsed = parsePosition(this.getAttribute('position'));
    return parsed ? parsed.value : null;
  }

  set position(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('position');
      return;
    }
    const parsed = parsePosition(String(val));
    if (parsed) {
      this.setAttribute('position', parsed.value);
    } else {
      this.removeAttribute('position');
    }
  }

  /**
   * Returns the active filter Set ('all', 'shortcuts', 'navigation').
   * @returns {Set<'all' | 'shortcuts' | 'navigation'>}
   */
  get activeFilters() {
    const filterAttr =
      this.getAttribute('filter') ??
      this.getAttribute('mode') ??
      this.getAttribute('show');

    return parseFilters(filterAttr, {
      all: this.hasAttribute('all'),
      shortcuts: this.hasAttribute('shortcuts'),
      navigation: this.hasAttribute('navigation') || this.hasAttribute('navigational'),
    });
  }

  /**
   * Gets or sets the filter attribute.
   */
  get filter() {
    return (
      this.getAttribute('filter') ||
      Array.from(this.activeFilters).join(', ')
    );
  }

  set filter(val) {
    if (val === null || val === undefined) {
      this.removeAttribute('filter');
    } else {
      this.setAttribute('filter', String(val));
    }
  }

  /**
   * Gets or sets the theme ('apple' or 'mechanical').
   */
  get theme() {
    return this.getAttribute('theme') || 'apple';
  }

  set theme(val) {
    if (val === null || val === undefined) {
      this.setAttribute('theme', 'apple');
    } else {
      this.setAttribute('theme', String(val));
    }
  }

  /**
   * Gets or sets the effective platform ('mac' or 'windows').
   */
  get platform() {
    return detectPlatform(this.getAttribute('platform') || 'auto');
  }

  set platform(val) {
    if (val === null || val === undefined) {
      this.removeAttribute('platform');
    } else {
      this.setAttribute('platform', String(val));
    }
  }

  /**
   * Gets or sets the currently displayed keystroke string (e.g. "SHIFT + TAB").
   */
  get keys() {
    return this.#currentLabel;
  }

  set keys(val) {
    this.showKeys(val);
  }

  /**
   * Programmatically displays a keystroke string or array of key labels.
   *
   * @param {string | string[]} input - e.g. "CMD + A", "SHIFT + TAB", "→", or ['SHIFT', 'TAB']
   */
  showKeys(input) {
    this.#clearTimer();
    const parsed = parseKeystrokeString(input, {
      platform: this.platform,
      notation: this.getAttribute('notation') || 'text',
    });

    this.#currentKeys = parsed.keys;
    this.#currentLabel = parsed.label;
    this.#render();
    this.#scheduleAutoClear();
  }

  /**
   * Processes a KeyboardEvent directly and updates the display if it matches the active filters.
   *
   * @param {KeyboardEvent | object} event
   * @returns {boolean} True if the keystroke matched the filter and was displayed
   */
  handleKeyEvent(event) {
    const effectivePlatform = this.platform;
    const explicitWindowsOnMac =
      effectivePlatform === 'windows' &&
      this.#isPhysicalMac &&
      Boolean(this.getAttribute('platform'));

    const result = formatKeystrokeEvent(event, {
      filters: this.activeFilters,
      platform: effectivePlatform,
      notation: this.getAttribute('notation') || 'text',
      mapMetaToCtrlOnWindows: explicitWindowsOnMac,
    });

    if (!result.shouldShow) {
      return false;
    }

    this.#clearTimer();
    this.setAttribute('pressed', '');
    this.#currentKeys = result.keys;
    this.#currentLabel = result.label;
    this.#render();
    this.#scheduleAutoClear();

    this.dispatchEvent(
      new CustomEvent('keystroke', {
        bubbles: true,
        composed: true,
        detail: {
          keys: result.keys.map((k) => k.label),
          label: result.label,
          category: result.category,
          platform: effectivePlatform,
          originalEvent: event,
        },
      })
    );

    return true;
  }

  /**
   * Clears the currently displayed keystroke.
   */
  clear() {
    this.#clearTimer();
    if (this.#fallbackRafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.#fallbackRafId);
      this.#fallbackRafId = null;
    }
    this.#currentKeys = [];
    this.#currentLabel = '';
    this.removeAttribute('pressed');
    this.removeAttribute('fading');
    this.removeAttribute('active');

    // Clear position-anchor and position-try-fallbacks after fade-out while hidden
    this.style.setProperty('position-anchor', 'none');
    this.style.setProperty('position-try-fallbacks', 'none');

    if (typeof requestAnimationFrame === 'function') {
      this.#fallbackRafId = requestAnimationFrame(() => {
        this.#fallbackRafId = requestAnimationFrame(() => {
          this.#fallbackRafId = null;
          if (this.#currentKeys.length === 0 && this.#container) {
            this.#container.classList.remove('is-fading');
            this.#container.replaceChildren();
            this.#container.classList.add('is-empty');
          }
        });
      });
    } else {
      this.#container.classList.remove('is-fading');
      this.#render();
    }
  }

  #attachListeners() {
    if (this.hasAttribute('static') || this.hasAttribute('disabled')) {
      return;
    }

    const targetAttr = this.getAttribute('target');
    let target = typeof window !== 'undefined' ? window : null;

    if (targetAttr === 'self' || targetAttr === 'host') {
      target = this;
    } else if (targetAttr === 'document' && typeof document !== 'undefined') {
      target = document;
    } else if (targetAttr && targetAttr !== 'window' && typeof document !== 'undefined') {
      target = document.querySelector(targetAttr) || window;
    }

    if (target) {
      this.#targetElement = target;
      target.addEventListener('keydown', this.#boundKeyDown, { capture: true });
      target.addEventListener('keyup', this.#boundKeyUp, { capture: true });
      if (typeof window !== 'undefined') {
        window.addEventListener('blur', this.#boundBlur);
      }
    }
  }

  #detachListeners() {
    if (this.#targetElement) {
      this.#targetElement.removeEventListener('keydown', this.#boundKeyDown, { capture: true });
      this.#targetElement.removeEventListener('keyup', this.#boundKeyUp, { capture: true });
      this.#targetElement = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this.#boundBlur);
    }
  }

  #onKeyDown(event) {
    this.handleKeyEvent(event);
  }

  #onKeyUp() {
    this.removeAttribute('pressed');
    this.#scheduleAutoClear();
  }

  #onBlur() {
    this.removeAttribute('pressed');
  }

  #scheduleAutoClear() {
    if (
      this.hasAttribute('static') ||
      this.hasAttribute('disabled') ||
      this.#currentKeys.length === 0
    ) {
      return;
    }

    const timeoutMs = this.timeout;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return;
    }

    const fadeDurationMs = this.fadeDuration;
    this.#syncFadeDurationStyle();
    this.#clearTimer();

    this.#fadeTimer = setTimeout(() => {
      if (fadeDurationMs <= 0) {
        this.clear();
        return;
      }

      this.setAttribute('fading', '');
      this.#container.classList.add('is-fading');
      this.#fadeTimer = setTimeout(() => {
        this.clear();
      }, fadeDurationMs);
    }, timeoutMs);
  }

  #clearTimer() {
    if (this.#fadeTimer) {
      clearTimeout(this.#fadeTimer);
      this.#fadeTimer = null;
    }
    this.removeAttribute('fading');
    if (this.#container) {
      this.#container.classList.remove('is-fading');
    }
  }

  #render() {
    if (!this.#container) {
      return;
    }

    if (this.#fallbackRafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.#fallbackRafId);
      this.#fallbackRafId = null;
    }

    this.#container.replaceChildren();

    if (this.#currentKeys.length === 0) {
      this.#container.classList.add('is-empty');
      this.removeAttribute('active');
      this.style.setProperty('position-anchor', 'none');
      this.style.setProperty('position-try-fallbacks', 'none');
      return;
    }

    this.#container.classList.remove('is-empty');
    this.#container.classList.remove('is-fading');
    this.setAttribute('active', '');

    const fragment = document.createDocumentFragment();

    this.#currentKeys.forEach((keyItem, index) => {
      if (index > 0) {
        const sep = document.createElement('span');
        sep.className = 'separator';
        sep.setAttribute('part', 'separator');
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = ' + ';
        fragment.appendChild(sep);
      }

      const kbd = document.createElement('kbd');
      const isSingleChar = keyItem.label.length === 1;
      const isArrow =
        keyItem.label === '→' ||
        keyItem.label === '←' ||
        keyItem.label === '↑' ||
        keyItem.label === '↓';

      const classes = ['key'];
      const parts = ['key'];

      if (keyItem.type === 'modifier') {
        classes.push('is-modifier');
        parts.push('modifier');
      } else {
        parts.push('primary');
      }

      if (isSingleChar) {
        classes.push('is-square');
      }
      if (isArrow) {
        classes.push('is-arrow');
      }

      kbd.className = classes.join(' ');
      kbd.setAttribute('part', parts.join(' '));
      kbd.textContent = keyItem.label;
      fragment.appendChild(kbd);
    });

    this.#container.appendChild(fragment);

    // Reinstate position-anchor immediately and reinstate position-try-fallbacks after one rendered frame
    // so Blink evaluates the base position-area at the current pointer coordinates first.
    this.style.removeProperty('position-anchor');
    if (typeof requestAnimationFrame === 'function') {
      this.style.setProperty('position-try-fallbacks', 'none');
      this.#fallbackRafId = requestAnimationFrame(() => {
        this.#fallbackRafId = requestAnimationFrame(() => {
          this.#fallbackRafId = null;
          if (this.#currentKeys.length > 0) {
            this.style.removeProperty('position-try-fallbacks');
          }
        });
      });
    } else {
      this.style.removeProperty('position-try-fallbacks');
    }
  }
}

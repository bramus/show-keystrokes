/**
 * <show-keystrokes> Custom Element
 * Visualizes keystrokes, keyboard shortcuts, and navigational keys with
 * configurable show modes, macOS/Windows support, and customizable themes.
 */

import {
  DEFAULT_HIDE_DELAY,
  DEFAULT_HIDE_DURATION,
  DEFAULT_SIZE,
  DEFAULT_POSITION,
  DEFAULT_NOTATION,
  detectPlatform,
  parseKeystrokes,
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
    --_hide-duration: var(--show-keystrokes-hide-duration, var(--_attr-hide-duration, ${DEFAULT_HIDE_DURATION}ms));

    /* Default Theme: Modern Keyboard (Light & Dark via light-dark()) */
    color-scheme: light dark;

    --_modern-bg-light: linear-gradient(180deg, #ffffff 0%, #f7f7fa 100%);
    --_modern-bg-dark: linear-gradient(180deg, #262629 0%, #161618 100%);
    --_modern-color-light: #515154;
    --_modern-color-dark: #d1d1d6;
    --_modern-border-light: #d2d2d7;
    --_modern-border-dark: #3a3a3c;
    --_modern-shadow-light: 0 2px 0 0 #c7c7cc, 0 3px 6px rgba(0, 0, 0, 0.08), inset 0 1px 0 #ffffff;
    --_modern-shadow-dark: 0 2px 0 0 #000000, 0 4px 10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    --_modern-sep-light: #86868b;
    --_modern-sep-dark: #98989d;

    --_key-bg: var(--show-keystrokes-key-bg, light-dark(#ffffff, #1c1c1e));
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_modern-bg-light));
    --_key-color: var(--show-keystrokes-key-color, light-dark(var(--_modern-color-light), var(--_modern-color-dark)));
    --_key-border: var(--show-keystrokes-key-border, 1px solid light-dark(var(--_modern-border-light), var(--_modern-border-dark)));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_modern-shadow-light));
    --_modifier-bg: var(--show-keystrokes-modifier-bg, var(--_key-bg));
    --_modifier-bg-image: var(--show-keystrokes-modifier-bg-image, var(--_key-bg-image));
    --_modifier-color: var(--show-keystrokes-modifier-color, var(--_key-color));
    --_separator-color: var(--show-keystrokes-separator-color, light-dark(var(--_modern-sep-light), var(--_modern-sep-dark)));

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

  :host([hidden]),
  :host([disabled]:not([static])) {
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
   * VIEWPORT & POINTER ANCHOR POSITIONING
   * Places the inner popover container in the Top Layer anchored to .anchor.
   * - When position="viewport ..." (default), .anchor spans the full viewport
   *   (position: fixed; inset: 0; width: 100%; height: 100%) and .container[popover]
   *   is anchored to its inside (position-area: center center) with
   *   inset: var(--show-keystrokes-position-offset, 1rem) and positioned via
   *   align-self and justify-self.
   * - When position="pointer ...", .anchor is sized via --show-keystrokes-anchor-size
   *   at the pointer coordinates and .container[popover] is anchored around it.
   * - Set position="normal" (or static) for normal document flow.
   * ========================================================================== */
  :host([position="normal" i]),
  :host([static]) {
    position: static;
    inset: auto;
    translate: none;
  }

  :host(:not([position="normal" i]):not([static])) {
    position: fixed;
    width: 0;
    height: 0;
    overflow: visible;
    pointer-events: none;
  }

  .anchor {
    display: none;
    pointer-events: none;
    opacity: 0;
  }

  :host(:not([position="normal" i]):not([static]):not([position~="pointer" i])) .anchor {
    display: block;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    anchor-name: --show-keystrokes-anchor;
  }

  :host([position~="pointer" i]:not([static])) .anchor {
    display: block;
    position: fixed;
    top: var(--show-keystrokes-pointer-y, 50vh);
    left: var(--show-keystrokes-pointer-x, 50vw);
    width: var(--show-keystrokes-anchor-size, 1.25rem);
    height: var(--show-keystrokes-anchor-size, 1.25rem);
    translate: -50% -50%;
    anchor-name: --show-keystrokes-anchor;
  }

  .container[popover] {
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    overflow: visible;
    width: max-content;
    height: max-content;
    max-width: none;
    max-height: none;
    pointer-events: var(--show-keystrokes-pointer-events, none);
  }

  .container[popover]:not(:popover-open) {
    display: none;
  }

  :host(:not([position="normal" i]):not([static]):not([position~="pointer" i])) .container[popover] {
    position: fixed;
    position-anchor: --show-keystrokes-anchor;
    position-area: center center;
    inset: var(--_position-offset);
    margin: 0;
    translate: none;
    align-self: start;
    justify-self: end;
  }

  :host([position~="top" i][position~="left" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: start;
    justify-self: start;
  }

  :host([position~="top" i][position~="center" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: start;
    justify-self: center;
  }

  :host(:not([position]):not([static])) .container[popover],
  :host([position="viewport" i]:not([static])) .container[popover],
  :host([position~="top" i][position~="right" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: start;
    justify-self: end;
  }

  :host([position~="center" i][position~="left" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: center;
    justify-self: start;
  }

  :host([position="center center" i]:not([static])) .container[popover],
  :host([position="viewport center center" i]:not([static])) .container[popover] {
    align-self: center;
    justify-self: center;
  }

  :host([position~="center" i][position~="right" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: center;
    justify-self: end;
  }

  :host([position~="bottom" i][position~="left" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: end;
    justify-self: start;
  }

  :host([position~="bottom" i][position~="center" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: end;
    justify-self: center;
  }

  :host([position~="bottom" i][position~="right" i]:not([position~="pointer" i]):not([static])) .container[popover] {
    align-self: end;
    justify-self: end;
  }

  /* ==========================================================================
   * POINTER ANCHOR POSITIONING
   * (position="pointer [<top|center|bottom> <left|center|right>]")
   * Anchors the top-layer popover container to .anchor tracking the pointer
   * using CSS Anchor Positioning (position-area & position-try-fallbacks).
   * ========================================================================== */
  :host([position~="pointer" i]:not([static])) .container[popover] {
    position: fixed;
    inset: auto;
    translate: none;
    position-anchor: --show-keystrokes-anchor;
    position-area: bottom right;
    position-try-fallbacks: none;
    position-visibility: always;
    margin: var(--show-keystrokes-pointer-gap, 0.25rem);
  }

  :host([position~="pointer" i][active]:not([static])) .container[popover] {
    position-try-fallbacks: flip-inline, flip-block, flip-inline flip-block;
  }

  :host([position~="pointer" i][position~="top" i][position~="left" i]) .container[popover] {
    position-area: top left;
  }

  :host([position~="pointer" i][position~="top" i][position~="center" i]) .container[popover] {
    position-area: top center;
  }

  :host([position~="pointer" i][position~="top" i][position~="right" i]) .container[popover] {
    position-area: top right;
  }

  :host([position~="pointer" i][position~="center" i][position~="left" i]) .container[popover] {
    position-area: center left;
  }

  :host([position="pointer center center" i]) .container[popover] {
    position-area: center center;
  }

  :host([position~="pointer" i][position~="center" i][position~="right" i]) .container[popover] {
    position-area: center right;
  }

  :host([position~="pointer" i][position~="bottom" i][position~="left" i]) .container[popover] {
    position-area: bottom left;
  }

  :host([position~="pointer" i][position~="bottom" i][position~="center" i]) .container[popover] {
    position-area: bottom center;
  }

  :host([position~="pointer" i][position~="bottom" i][position~="right" i]) .container[popover] {
    position-area: bottom right;
  }

  /* Color scheme overrides via attribute */
  :host([color-scheme="light"]),
  :host([variant="light"]),
  :host([theme$="-light"]) {
    color-scheme: light;
    --_key-bg: var(--show-keystrokes-key-bg, #ffffff);
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_modern-bg-light));
    --_key-color: var(--show-keystrokes-key-color, var(--_modern-color-light));
    --_key-border: var(--show-keystrokes-key-border, 1px solid var(--_modern-border-light));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_modern-shadow-light));
    --_separator-color: var(--show-keystrokes-separator-color, var(--_modern-sep-light));
  }

  :host([color-scheme="dark"]),
  :host([variant="dark"]),
  :host([theme$="-dark"]) {
    color-scheme: dark;
    --_key-bg: var(--show-keystrokes-key-bg, #1c1c1e);
    --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_modern-bg-dark));
    --_key-color: var(--show-keystrokes-key-color, var(--_modern-color-dark));
    --_key-border: var(--show-keystrokes-key-border, 1px solid var(--_modern-border-dark));
    --_key-shadow: var(--show-keystrokes-key-shadow, var(--_modern-shadow-dark));
    --_separator-color: var(--show-keystrokes-separator-color, var(--_modern-sep-dark));
  }

  @media (prefers-color-scheme: dark) {
    :host(:not([color-scheme="light"]):not([variant="light"]):not([theme$="-light"])) {
      --_key-bg-image: var(--show-keystrokes-key-bg-image, var(--_modern-bg-dark));
      --_key-shadow: var(--show-keystrokes-key-shadow, var(--_modern-shadow-dark));
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
    --_hide-duration: var(--show-keystrokes-hide-duration, var(--_attr-hide-duration, ${DEFAULT_HIDE_DURATION}ms));
    transition: opacity var(--_hide-duration) ease, transform var(--_hide-duration) ease;
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
  }

  .key.is-arrow {
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

const activePointerInstances = new Set();
let pointerTrackingAttached = false;

const updatePointerAnchor = (event) => {
  if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') {
    return;
  }
  const x = `${event.clientX}px`;
  const y = `${event.clientY}px`;
  for (const instance of activePointerInstances) {
    instance.style.setProperty('--show-keystrokes-pointer-x', x);
    instance.style.setProperty('--show-keystrokes-pointer-y', y);
  }
};

function registerPointerTracking(instance) {
  if (typeof window === 'undefined') {
    return;
  }
  activePointerInstances.add(instance);
  if (!pointerTrackingAttached) {
    pointerTrackingAttached = true;
    window.addEventListener('pointermove', updatePointerAnchor, { passive: true, capture: true });
    window.addEventListener('mousemove', updatePointerAnchor, { passive: true, capture: true });
    window.addEventListener('pointerdown', updatePointerAnchor, { passive: true, capture: true });
  }
}

function unregisterPointerTracking(instance) {
  activePointerInstances.delete(instance);
  instance?.style?.removeProperty('--show-keystrokes-pointer-x');
  instance?.style?.removeProperty('--show-keystrokes-pointer-y');
  if (activePointerInstances.size === 0 && pointerTrackingAttached && typeof window !== 'undefined') {
    pointerTrackingAttached = false;
    window.removeEventListener('pointermove', updatePointerAnchor, { passive: true, capture: true });
    window.removeEventListener('mousemove', updatePointerAnchor, { passive: true, capture: true });
    window.removeEventListener('pointerdown', updatePointerAnchor, { passive: true, capture: true });
  }
}

export class ShowKeystrokes extends HTMLElement {
  static get observedAttributes() {
    return [
      'keystrokes',
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
      'hide-delay',
      'hide-duration',
      'static',
      'disabled',
      'target',
    ];
  }

  #anchor = null;
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

    const anchorEl = document.createElement('div');
    anchorEl.className = 'anchor';
    anchorEl.setAttribute('part', 'anchor');
    anchorEl.setAttribute('aria-hidden', 'true');

    const containerEl = document.createElement('div');
    containerEl.className = 'container is-empty';
    containerEl.setAttribute('part', 'container');
    containerEl.setAttribute('role', 'status');
    containerEl.setAttribute('aria-live', 'polite');

    this.shadowRoot.append(styleEl, anchorEl, containerEl);
    this.#anchor = anchorEl;
    this.#container = containerEl;

    this.#isPhysicalMac = detectPlatform('auto') === 'mac';
    this.#boundKeyDown = this.#onKeyDown.bind(this);
    this.#boundKeyUp = this.#onKeyUp.bind(this);
    this.#boundBlur = this.#onBlur.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute('theme')) {
      this.setAttribute('theme', 'modern');
    }

    if (this.hasAttribute('position')) {
      this.#syncPositionAttribute(this.getAttribute('position'));
    } else {
      this.#syncPopoverAttribute();
      this.#syncPointerTracking();
    }

    if (this.hasAttribute('size')) {
      this.#syncSizeAttribute(this.getAttribute('size'));
    }

    this.#syncHideDurationStyle();
    this.#attachListeners();

    // Check if declarative keys attribute or child text content was provided
    const initialKeys = this.getAttribute('keys') || this.textContent?.trim();
    if (initialKeys && (!this.disabled || this.hasAttribute('static'))) {
      this.showKeys(initialKeys);
    } else {
      this.#render();
    }
  }

  disconnectedCallback() {
    this.#detachListeners();
    this.#clearTimer();
    this.#hidePopover();
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

    if (name === 'hide-duration') {
      this.#syncHideDurationStyle();
      if (this.#currentKeys.length > 0) {
        this.#scheduleAutoClear();
      }
      return;
    }

    if (name === 'hide-delay') {
      if (this.#currentKeys.length > 0) {
        this.#scheduleAutoClear();
      }
      return;
    }

    if (name === 'disabled') {
      this.#detachListeners();
      if (this.disabled) {
        this.#clearTimer();
        if (!this.hasAttribute('static') && this.#currentKeys.length > 0) {
          this.clear();
        }
      } else {
        this.#attachListeners();
      }
      return;
    }

    if (name === 'static' || name === 'target') {
      this.#syncPopoverAttribute();
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

    if (name === 'keystrokes') {
      if (this.activeKeystrokes.size === 0 && this.#currentKeys.length > 0) {
        this.clear();
      }
      return;
    }

    if (name === 'notation' && this.#currentLabel) {
      this.showKeys(this.#currentLabel);
    }
  }

  #isTopLayerMode() {
    return !this.hasAttribute('static') && this.position !== 'normal';
  }

  #isPointerMode() {
    return (
      this.isConnected &&
      !this.disabled &&
      !this.hasAttribute('static') &&
      parsePosition(this.position)?.anchor === 'pointer'
    );
  }

  #syncPointerTracking() {
    if (this.#isPointerMode()) {
      registerPointerTracking(this);
    } else {
      unregisterPointerTracking(this);
    }
  }

  #syncPopoverAttribute() {
    if (!this.#container) {
      return;
    }
    if (this.#isTopLayerMode()) {
      if (this.#container.getAttribute('popover') !== 'manual') {
        this.#container.setAttribute('popover', 'manual');
      }
      if (this.#currentKeys.length > 0 && this.isConnected && !this.disabled) {
        this.#showPopover();
      }
    } else {
      if (this.#container.hasAttribute('popover')) {
        this.#hidePopover();
        this.#container.removeAttribute('popover');
      }
    }
  }

  #showPopover() {
    if (!this.#container || !this.isConnected || this.disabled || !this.#isTopLayerMode()) {
      return;
    }
    if (this.#container.getAttribute('popover') !== 'manual') {
      this.#container.setAttribute('popover', 'manual');
    }
    if (typeof this.#container.showPopover === 'function') {
      try {
        if (!this.#container.matches(':popover-open')) {
          this.#container.showPopover();
        }
      } catch {
        // Ignore if already open or not supported
      }
    }
  }

  #hidePopover() {
    if (!this.#container || !this.#container.hasAttribute('popover')) {
      return;
    }
    if (typeof this.#container.hidePopover === 'function') {
      try {
        if (this.#container.matches(':popover-open')) {
          this.#container.hidePopover();
        }
      } catch {
        // Ignore if already hidden
      }
    }
  }

  #syncPositionAttribute(rawVal) {
    if (rawVal) {
      const parsed = parsePosition(rawVal);
      if (parsed && rawVal !== parsed.value) {
        this.setAttribute('position', parsed.value);
        return;
      }
    }
    this.#syncPopoverAttribute();
    this.#syncPointerTracking();
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
   * Gets or sets whether the component is disabled.
   * Reflects the boolean `disabled` HTML attribute.
   * @returns {boolean}
   */
  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    const isDisabled = Boolean(val);
    if (isDisabled) {
      if (!this.hasAttribute('disabled')) {
        this.setAttribute('disabled', '');
      }
    } else if (this.hasAttribute('disabled')) {
      this.removeAttribute('disabled');
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

  #syncHideDurationStyle() {
    const raw = this.getAttribute('hide-duration');
    if (raw !== null && raw !== '') {
      this.style.setProperty('--_attr-hide-duration', `${parseDurationMs(raw, DEFAULT_HIDE_DURATION)}ms`);
    } else {
      this.style.removeProperty('--_attr-hide-duration');
    }
  }

  /**
   * Gets or sets the delay in milliseconds before the displayed keystroke starts fading out.
   * Defaults to 1250 (ms). Set to 0 to disable auto-hiding.
   * @returns {number}
   */
  get hideDelay() {
    const raw = this.getAttribute('hide-delay');
    return parseDurationMs(raw, DEFAULT_HIDE_DELAY);
  }

  set hideDelay(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('hide-delay');
    } else {
      this.setAttribute('hide-delay', String(parseDurationMs(val, DEFAULT_HIDE_DELAY)));
    }
  }

  /**
   * Gets or sets the duration of the fade-out transition in milliseconds.
   * Defaults to 200 (ms). The `--show-keystrokes-hide-duration` CSS custom property
   * takes precedence over the `hide-duration` attribute.
   * @returns {number}
   */
  get hideDuration() {
    if (typeof getComputedStyle === 'function') {
      const cssVal = getComputedStyle(this).getPropertyValue('--show-keystrokes-hide-duration').trim();
      if (cssVal) {
        if (cssVal.endsWith('ms')) {
          return parseDurationMs(parseFloat(cssVal), DEFAULT_HIDE_DURATION);
        }
        if (cssVal.endsWith('s')) {
          return parseDurationMs(parseFloat(cssVal) * 1000, DEFAULT_HIDE_DURATION);
        }
        return parseDurationMs(cssVal, DEFAULT_HIDE_DURATION);
      }
    }
    const raw = this.getAttribute('hide-duration');
    return parseDurationMs(raw, DEFAULT_HIDE_DURATION);
  }

  set hideDuration(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('hide-duration');
    } else {
      this.setAttribute('hide-duration', String(parseDurationMs(val, DEFAULT_HIDE_DURATION)));
    }
    this.#syncHideDurationStyle();
  }

  /**
   * Gets or sets the position (e.g. "viewport top right", "pointer bottom right", "normal").
   * Defaults to "viewport top right" (or "normal" when `static` is set).
   * @returns {string}
   */
  get position() {
    if (this.hasAttribute('static') && !this.hasAttribute('position')) {
      return 'normal';
    }
    const parsed = parsePosition(this.getAttribute('position'));
    return parsed ? parsed.value : DEFAULT_POSITION;
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
   * Returns the active keystrokes Set ('all', 'shortcuts', 'navigational'), or an empty Set for 'none'.
   * @returns {Set<'all' | 'shortcuts' | 'navigational'>}
   */
  get activeKeystrokes() {
    return parseKeystrokes(this.getAttribute('keystrokes'), {
      all: this.hasAttribute('all'),
      shortcuts: this.hasAttribute('shortcuts'),
      navigational: this.hasAttribute('navigational') || this.hasAttribute('navigation'),
    });
  }

  /**
   * Gets or sets the `keystrokes` attribute:
   * - '' (no value): Shortcuts & Navigational (default)
   * - 'all': All keystrokes
   * - 'shortcuts': Shortcuts only
   * - 'navigational': Navigational Keys only
   * - 'none': Nothing
   */
  get keystrokes() {
    return this.getAttribute('keystrokes') || '';
  }

  set keystrokes(val) {
    if (val === null || val === undefined || val === '') {
      this.removeAttribute('keystrokes');
    } else {
      this.setAttribute('keystrokes', String(val));
    }
  }

  /**
   * Gets or sets the theme ('modern' or 'mechanical').
   */
  get theme() {
    return this.getAttribute('theme') || 'modern';
  }

  set theme(val) {
    if (val === null || val === undefined) {
      this.setAttribute('theme', 'modern');
    } else {
      this.setAttribute('theme', String(val));
    }
  }

  /**
   * Gets or sets the color scheme ('light', 'dark', or 'auto').
   */
  get colorScheme() {
    return this.getAttribute('color-scheme') || this.getAttribute('variant') || 'auto';
  }

  set colorScheme(val) {
    if (val === null || val === undefined || val === '' || val === 'auto') {
      this.removeAttribute('color-scheme');
    } else {
      this.setAttribute('color-scheme', String(val));
    }
  }

  /**
   * Gets or sets whether the component is in static display mode.
   * Reflects the boolean `static` HTML attribute.
   * @returns {boolean}
   */
  get static() {
    return this.hasAttribute('static');
  }

  set static(val) {
    if (Boolean(val)) {
      if (!this.hasAttribute('static')) {
        this.setAttribute('static', '');
      }
    } else if (this.hasAttribute('static')) {
      this.removeAttribute('static');
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
   * Gets or sets the key label notation ('symbols' or 'text').
   * Defaults to 'symbols'.
   * @returns {'symbols' | 'text'}
   */
  get notation() {
    return this.getAttribute('notation') === 'text' ? 'text' : DEFAULT_NOTATION;
  }

  set notation(val) {
    if (val === null || val === undefined || val === '' || val === DEFAULT_NOTATION) {
      this.removeAttribute('notation');
    } else {
      this.setAttribute('notation', String(val));
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
    if (this.disabled && !this.hasAttribute('static')) {
      return;
    }
    this.#clearTimer();
    const parsed = parseKeystrokeString(input, {
      platform: this.platform,
      notation: this.notation,
    });

    this.#currentKeys = parsed.keys;
    this.#currentLabel = parsed.label;
    this.#render();
    this.#scheduleAutoClear();
  }

  /**
   * Processes a KeyboardEvent directly and updates the display if it matches the active `keystrokes` mode.
   *
   * @param {KeyboardEvent | object} event
   * @returns {boolean} True if the keystroke matched the active `keystrokes` mode and was displayed
   */
  handleKeyEvent(event) {
    if (this.disabled) {
      return false;
    }

    const effectivePlatform = this.platform;
    const explicitWindowsOnMac =
      effectivePlatform === 'windows' &&
      this.#isPhysicalMac &&
      Boolean(this.getAttribute('platform'));

    const result = formatKeystrokeEvent(event, {
      keystrokes: this.activeKeystrokes,
      platform: effectivePlatform,
      notation: this.notation,
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

    // Hide top-layer popover after fade-out completes
    this.#hidePopover();

    // Clear position-anchor and position-try-fallbacks after fade-out while hidden
    if (this.#container) {
      this.#container.style.setProperty('position-anchor', 'none');
      this.#container.style.setProperty('position-try-fallbacks', 'none');
    }

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
    this.#syncPointerTracking();

    if (this.hasAttribute('static') || this.disabled) {
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
    unregisterPointerTracking(this);
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

    const hideDelayMs = this.hideDelay;
    if (!Number.isFinite(hideDelayMs) || hideDelayMs <= 0) {
      return;
    }

    const hideDurationMs = this.hideDuration;
    this.#syncHideDurationStyle();
    this.#clearTimer();

    this.#fadeTimer = setTimeout(() => {
      if (hideDurationMs <= 0) {
        this.clear();
        return;
      }

      this.setAttribute('fading', '');
      this.#container.classList.add('is-fading');
      this.#fadeTimer = setTimeout(() => {
        this.clear();
      }, hideDurationMs);
    }, hideDelayMs);
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

    this.#syncPopoverAttribute();
    this.#container.replaceChildren();

    if (this.#currentKeys.length === 0) {
      this.#container.classList.add('is-empty');
      this.removeAttribute('active');
      this.#hidePopover();
      this.#container.style.setProperty('position-anchor', 'none');
      this.#container.style.setProperty('position-try-fallbacks', 'none');
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
    this.#showPopover();

    // Reinstate position-anchor immediately and reinstate position-try-fallbacks after one rendered frame
    // so Blink evaluates the base position-area at the current pointer coordinates first.
    this.#container.style.removeProperty('position-anchor');
    if (typeof requestAnimationFrame === 'function') {
      this.#container.style.setProperty('position-try-fallbacks', 'none');
      this.#fallbackRafId = requestAnimationFrame(() => {
        this.#fallbackRafId = requestAnimationFrame(() => {
          this.#fallbackRafId = null;
          if (this.#currentKeys.length > 0 && this.#container) {
            this.#container.style.removeProperty('position-try-fallbacks');
          }
        });
      });
    } else {
      this.#container.style.removeProperty('position-try-fallbacks');
    }
  }
}

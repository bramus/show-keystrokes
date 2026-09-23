# show-keystrokes

> A zero-dependency custom element that visualizes keystrokes, keyboard shortcuts, and navigational keys with macOS & Windows support and stylable themes.

[![npm version](https://img.shields.io/npm/v/show-keystrokes.svg)](https://www.npmjs.com/package/show-keystrokes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo & Playground → https://show-keystrokes.netlify.app/**](https://show-keystrokes.netlify.app/)

## Features

- **Real-Time Keystroke Visualization**:
  - Hit the right arrow key → renders `→`
  - Hit `Tab` while holding `Shift` → renders `SHIFT + TAB`
  - Hit `A` while holding `Cmd` (macOS) → renders `CMD + A` (or `CTRL + A` on Windows)
  - Hit `T` while holding `Shift` and `Cmd` → renders `SHIFT + CMD + T`
- **Configurable Content (`keystrokes`)**:
  - **Default (no value)**: Shows keyboard shortcuts (`CMD + A`, `SHIFT + CMD + T`, `SHIFT + ENTER`, `CTRL + C`, …) and navigational keys (`TAB`, `→`, `←`, `↑`, `↓`, `SPACE`, `BACKSPACE`, `DELETE`, `F1`–`F15`, `HOME`, `END`, `PAGE UP`, `PAGE DOWN`, `ENTER`, `ESC`).
  - **All Keystrokes (`keystrokes="all"`)**: Shows every key press including letters, digits, symbols, shortcuts, and navigational keys.
  - **Shortcuts Only (`keystrokes="shortcuts"`)**: Shows only modifier combinations and function keys.
  - **Navigational Keys Only (`keystrokes="navigational"`)**: Shows only navigational and special keys (`TAB`, arrows, `SPACE`, etc.).
  - **Nothing (`keystrokes="none"`)**: Shows nothing.
- **Cross-Platform & Symbol Glyphs (`platform` & `notation`)**:
  - Automatically detects macOS (`⌘`, `⌥`, `⇧`, `⌃`) vs. Windows/Linux (`CTRL`, `ALT`, `⇧`, `⊞`).
  - Override explicitly with `platform="mac"` or `platform="windows"`.
  - Renders symbol glyphs by default (`notation="symbols"` → `⌘`, `⌥`, `⇧`, `⌃`, `⇥`, `↵`, `⎋`, `⌫`, `⌦`, …) or text labels (`notation="text"` → `CMD`, `OPT`, `SHIFT`, `CTRL`, `TAB`, `ENTER`, …).
- **Two Built-In Themes with Light & Dark Variants**:
  - **Modern (`theme="modern"`)**: Clean, low-profile keycaps—white rounded squares with grey text in light mode; black rounded squares with lightgrey text in dark mode.
  - **Mechanical Keyboard (`theme="mechanical"`)**: Sculpted 3D keycap dish with monospace legends and accented modifier keys in both light and dark modes.
  - Supports automatic `light-dark()` adaptation or explicit `color-scheme="light"` / `color-scheme="dark"`.
- **Highly Stylable**:
  - Customize with CSS Custom Properties (`--show-keystrokes-key-bg`, `--show-keystrokes-key-color`, `--show-keystrokes-key-radius`, etc.) or Shadow DOM parts (`::part(key)`, `::part(modifier)`, `::part(primary)`, `::part(separator)`).

---

## Installation & Setup

### 1. Using npm

```bash
npm install show-keystrokes
```

Import the module to automatically register `<show-keystrokes>`:

```javascript
import 'show-keystrokes';
```

### 2. Using a CDN

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/show-keystrokes/index.js"></script>
```

---

## Usage

### Live Keystroke Visualizer

```html
<!-- Default: shows shortcuts and navigational keys -->
<show-keystrokes></show-keystrokes>

<!-- Show all keystrokes -->
<show-keystrokes keystrokes="all"></show-keystrokes>

<!-- Show only shortcuts -->
<show-keystrokes keystrokes="shortcuts"></show-keystrokes>

<!-- Show only navigational keys -->
<show-keystrokes keystrokes="navigational"></show-keystrokes>

<!-- Show nothing -->
<show-keystrokes keystrokes="none"></show-keystrokes>
```

### Themes & Light/Dark Variants

```html
<!-- Modern (Light & Dark) -->
<show-keystrokes theme="modern" color-scheme="light"></show-keystrokes>
<show-keystrokes theme="modern" color-scheme="dark"></show-keystrokes>

<!-- Mechanical Keyboard (Light & Dark) -->
<show-keystrokes theme="mechanical" color-scheme="light"></show-keystrokes>
<show-keystrokes theme="mechanical" color-scheme="dark"></show-keystrokes>
```

### Sizing (`size` & CSS `font-size`)

Use the `size` attribute (`small`, `medium`, `large`, `x-large`, `xx-large` — defaults to `large`) to adjust the base `font-size` of the component, or omit the `size` attribute and set `font-size` directly via CSS:

```html
<show-keystrokes size="small"></show-keystrokes>
<show-keystrokes size="medium"></show-keystrokes>
<show-keystrokes size="large"></show-keystrokes>
<show-keystrokes size="x-large"></show-keystrokes>
<show-keystrokes size="xx-large"></show-keystrokes>
```

```css
/* When no size attribute is set, setting font-size scales the entire component */
show-keystrokes {
  font-size: 1.5rem;
}
```

### Positioning (`position`)

By default, `<show-keystrokes>` is positioned in the **`viewport`** (`top right` corner (`viewport top right`) with a `1rem` gap, customizable via `--show-keystrokes-position-offset`).

1. **Viewport Positioning (Default)**: Use `viewport` (defaults to `viewport top right`) or combine with any of `top` / `center` / `bottom` and `left` / `center` / `right`:
   ```html
   <!-- Default: fixed in the top-right corner of the viewport -->
   <show-keystrokes></show-keystrokes>
   <show-keystrokes position="viewport"></show-keystrokes>

   <!-- Fixed in the bottom-right corner of the viewport -->
   <show-keystrokes position="viewport bottom right"></show-keystrokes>

   <!-- Fixed at the bottom-center of the viewport -->
   <show-keystrokes position="viewport bottom center"></show-keystrokes>
   ```
2. **Pointer Positioning (CSS Anchor Positioning)**: Prefix `position` with `pointer` to anchor `<show-keystrokes>` to an invisible `#show-keystrokes-anchor` tracking the pointer via CSS Anchor Positioning (`position-area` + `position-try-fallbacks: flip-inline, flip-block, flip-inline flip-block`). When setting only `pointer`, it defaults to `pointer bottom right`:
   ```html
   <!-- Defaults to bottom right of the pointer -->
   <show-keystrokes position="pointer"></show-keystrokes>

   <!-- Positioned to the top right of the pointer -->
   <show-keystrokes position="pointer top right"></show-keystrokes>
   ```
3. **Normal Flow (`position="normal"`)**: Render `<show-keystrokes>` in normal document flow instead of fixed to the viewport or pointer:
   ```html
   <show-keystrokes position="normal"></show-keystrokes>
   ```

Accepted values:
- Viewport (Default): `viewport` (defaults to `viewport top right`), `viewport <top|center|bottom> <left|center|right>`, or `<top|center|bottom> <left|center|right>`
- Pointer: `pointer`, `pointer <top|center|bottom> <left|center|right>`
- Normal: `normal`

### Auto-Hide Delay & Duration (`hide-delay` & `hide-duration`)

By default, a pressed keystroke stays visible for **`1250` ms** (`hide-delay`) and then fades out smoothly over **`200` ms** (`hide-duration`). Both values are numbers expressed in milliseconds and can be customized via attributes or JS properties:

```html
<!-- Wait 2500ms before fading out over 500ms -->
<show-keystrokes hide-delay="2500" hide-duration="500"></show-keystrokes>

<!-- Disable auto-hiding by setting hide-delay="0" -->
<show-keystrokes hide-delay="0"></show-keystrokes>
```

### Key Label Notation (`notation`)

By default, `<show-keystrokes>` renders symbol glyphs (`notation="symbols"`), such as `⌘`, `⇧`, `⌥`, `⌃`, `🌐︎`, `⊞`, `⇥`, `↵`, `⎋`, `⌫`, `⌦`, `↖`, `↘`, `⇞`, `⇟`, and `⇪`. Set `notation="text"` to render text labels (`CMD`, `SHIFT`, `TAB`, `ENTER`, etc.):

```html
<!-- Default: symbol glyphs (e.g. ⇧ + ⌘ + T, ⇧ + ⇥) -->
<show-keystrokes notation="symbols"></show-keystrokes>

<!-- Text labels (e.g. SHIFT + CMD + T, SHIFT + TAB) -->
<show-keystrokes notation="text"></show-keystrokes>
```

### Static / Declarative Keycaps

Use `keys` and `static` to render static keycaps in documentation:

```html
<show-keystrokes keys="→" theme="modern" static></show-keystrokes>
<show-keystrokes keys="SHIFT + TAB" theme="modern" static></show-keystrokes>
<show-keystrokes keys="CMD + A" theme="modern" static></show-keystrokes>
```

### Enabling & Disabling (`disabled`)

Use the boolean `disabled` attribute or the `el.disabled` JavaScript property to disable `<show-keystrokes>`. When disabled, no event listeners (`keydown`, `keyup`, `blur`, or pointer tracking) are registered and any active live keystrokes are cleared. Updating `el.disabled` reflects to the DOM attribute, and modifying the `disabled` attribute updates `el.disabled`:

```html
<show-keystrokes disabled></show-keystrokes>
```

```javascript
const el = document.querySelector('show-keystrokes');
el.disabled = true;  // adds `disabled` attribute and detaches all listeners
el.disabled = false; // removes `disabled` attribute and re-attaches listeners
```

### Programmatic Creation (`create`)

Import `create(options, parentElement)` to dynamically create and append a `<show-keystrokes>` element:

```javascript
import { create } from 'show-keystrokes';

const el = create(
  {
    keystrokes: 'all',
    theme: 'modern',
    colorScheme: 'dark',
    size: 'large',
    position: 'viewport top right',
  },
  document.body
);
```

---

## Styling

### CSS Shadow Parts (`::part`)

| Part | Description |
| :--- | :--- |
| `::part(container)` | Outer flex wrapper containing the keycaps and `+` separators |
| `::part(key)` | Every `<kbd>` keycap element |
| `::part(modifier)` | Modifier `<kbd>` elements (`CMD`, `SHIFT`, `CTRL`, `ALT`, `WIN`) |
| `::part(primary)` | The primary non-modifier `<kbd>` element (`A`, `TAB`, `→`) |
| `::part(separator)` | The `+` separator `<span>` between keys |

### CSS Custom Properties

| Property | Description |
| :--- | :--- |
| `--show-keystrokes-key-bg` | Keycap background color |
| `--show-keystrokes-key-color` | Keycap text color |
| `--show-keystrokes-key-border` | Keycap border shorthand |
| `--show-keystrokes-key-radius` | Keycap border radius (default `8px` for `modern`) |
| `--show-keystrokes-key-shadow` | Keycap box shadow |
| `--show-keystrokes-key-min-size` | Minimum width and height of square keycaps (default `2.75rem`) |
| `--show-keystrokes-modifier-bg` | Background override for modifier keys |
| `--show-keystrokes-modifier-color` | Text color override for modifier keys |
| `--show-keystrokes-separator-color` | Color of the `+` separator |
| `--show-keystrokes-position-offset` | Viewport edge gap when `position` is set (default `1rem`) |

---

## Browser Extension

`<show-keystrokes>` is also available as a browser extension for when you want to inject it onto any webpage without modifying the page’s code—perfect for live demos, talks, and screen casting.

The extension is available on the [**Chrome Web Store**](https://chromewebstore.google.com/detail/show-keystrokes/djfbngdmoohldepblnidecjhmgommdmh) and on the [**Firefox Add-ons website**](https://addons.mozilla.org/en-US/firefox/addon/show-keystrokes/) *(Pending Review)*.

<p>
  <a href="https://chromewebstore.google.com/detail/show-keystrokes/djfbngdmoohldepblnidecjhmgommdmh"><img src="https://raw.githubusercontent.com/bramus/show-keystrokes/main/src/images/chrome-webstore.svg" alt="Available in the Chrome Web Store" height="62"></a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/show-keystrokes/"><img src="https://raw.githubusercontent.com/bramus/show-keystrokes/main/src/images/firefox-addons.svg" alt="Available on the Firefox Add-ons Website (Pending Review)" height="62"></a>
</p>

- **Persists across navigations:** Automatically re-injects `<show-keystrokes>` as you navigate between pages on an enabled origin—no need to re-inject on every page load.
- **Per-origin configuration & overrides:** Customize `keystrokes`, `position`, `positionArea`, and `size` for individual websites directly from the extension popup, with your settings saved and restored automatically on future visits.
- **Configurable global defaults:** Set your preferred default options (`keystrokes`, `position`, `size`, `theme`, `color-scheme`, `hide-delay`, and `hide-duration`), preview them live, and manage saved per-origin configurations from the extension’s Settings page.
- **Quick keyboard shortcut & status indicator:** Press `SHIFT + CMD + K` (macOS) or `SHIFT + CTRL + K` (Windows/Linux) to toggle `<show-keystrokes>` on or off at any time, with a green status badge on the toolbar icon showing when it is active.
- **Works on strict CSP websites:** Bundles `<show-keystrokes>` locally inside the extension so it works reliably even on websites whose Content Security Policy blocks external CDN scripts.

---

## License

MIT © [Bramus Van Damme](https://www.bram.us/)

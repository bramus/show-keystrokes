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
- **Configurable Display (`show`)**:
  - **Default (no value)**: Shows keyboard shortcuts (`CMD + A`, `SHIFT + CMD + T`, `SHIFT + ENTER`, `CTRL + C`, …) and navigational keys (`TAB`, `→`, `←`, `↑`, `↓`, `SPACE`, `BACKSPACE`, `DELETE`, `F1`–`F15`, `HOME`, `END`, `PAGE UP`, `PAGE DOWN`, `ENTER`, `ESC`).
  - **All Keystrokes (`show="all"`)**: Shows every key press including letters, digits, symbols, shortcuts, and navigational keys.
  - **Shortcuts Only (`show="shortcuts"`)**: Shows only modifier combinations and function keys.
  - **Navigational Keys Only (`show="navigational"`)**: Shows only navigational and special keys (`TAB`, arrows, `SPACE`, etc.).
  - **Nothing (`show="none"`)**: Shows nothing.
- **Cross-Platform (macOS & Windows/Linux)**:
  - Automatically detects macOS (`CMD`, `ALT`, `SHIFT`, `CTRL`) vs. Windows/Linux (`CTRL`, `ALT`, `SHIFT`, `WIN`).
  - Override explicitly with `platform="mac"` or `platform="windows"`.
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
<show-keystrokes show="all"></show-keystrokes>

<!-- Show only shortcuts -->
<show-keystrokes show="shortcuts"></show-keystrokes>

<!-- Show only navigational keys -->
<show-keystrokes show="navigational"></show-keystrokes>

<!-- Show nothing -->
<show-keystrokes show="none"></show-keystrokes>
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

### Viewport & Pointer Positioning (`position`)

Set the `position` attribute using any combination of `top` / `center` / `bottom` and `left` / `center` / `right`:

1. **Fixed Viewport Positioning**: Applies `position: fixed` at that viewport location with a `1rem` gap (customizable via `--show-keystrokes-position-offset`):
   ```html
   <!-- Fixed in the top-right corner of the viewport -->
   <show-keystrokes position="top right"></show-keystrokes>

   <!-- Fixed at the bottom-center of the viewport -->
   <show-keystrokes position="bottom center"></show-keystrokes>
   ```
2. **Pointer Positioning (CSS Anchor Positioning)**: Prefix `position` with `pointer` to anchor `<show-keystrokes>` to an invisible `#show-keystrokes-anchor` tracking the pointer via CSS Anchor Positioning (`position-area` + `position-try-fallbacks: flip-inline, flip-block, flip-inline flip-block`). When setting only `pointer`, it defaults to `pointer bottom right`:
   ```html
   <!-- Defaults to bottom right of the pointer -->
   <show-keystrokes position="pointer"></show-keystrokes>

   <!-- Positioned to the top right of the pointer -->
   <show-keystrokes position="pointer top right"></show-keystrokes>
   ```

Accepted values:
- Viewport: `top left`, `top center`, `top right`, `center left`, `center center`, `center right`, `bottom left`, `bottom center`, `bottom right`
- Pointer: `pointer`, `pointer <top|center|bottom> <left|center|right>`

### Auto-Hide Timeout & Fade-Out Duration (`timeout` & `fade-duration`)

By default, a pressed keystroke stays visible for **`1500` ms** (`timeout`) and then fades out smoothly over **`300` ms** (`fade-duration` / `fade-out`). Both values are numbers expressed in milliseconds and can be customized via attributes or JS properties:

```html
<!-- Wait 2500ms before fading out over 500ms -->
<show-keystrokes timeout="2500" fade-duration="500"></show-keystrokes>

<!-- Disable auto-hiding by setting timeout="0" -->
<show-keystrokes timeout="0"></show-keystrokes>
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

## License

MIT © [Bramus Van Damme](https://www.bram.us/)

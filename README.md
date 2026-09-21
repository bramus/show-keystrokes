# key-stroke

> A zero-dependency custom element that visualizes keystrokes, keyboard shortcuts, and navigational keys with macOS & Windows support and stylable themes.

[![npm version](https://img.shields.io/npm/v/key-stroke.svg)](https://www.npmjs.com/package/key-stroke)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[**Live Demo & Playground → https://key-stroke.netlify.app/**](https://key-stroke.netlify.app/)

## Features

- **Real-Time Keystroke Visualization**:
  - Hit the right arrow key → renders `→`
  - Hit `Tab` while holding `Shift` → renders `SHIFT + TAB`
  - Hit `A` while holding `Cmd` (macOS) → renders `CMD + A` (or `CTRL + A` on Windows)
  - Hit `T` while holding `Shift` and `Cmd` → renders `SHIFT + CMD + T`
- **Configurable Filtering (`filter`)**:
  - **Default (`"shortcuts, navigation"`)**: Shows keyboard shortcuts (`CMD + A`, `SHIFT + CMD + T`, `SHIFT + ENTER`, `CTRL + C`, …) and navigational keys (`TAB`, `→`, `←`, `↑`, `↓`, `HOME`, `END`, `PAGE UP`, `PAGE DOWN`, `ENTER`, `ESC`).
  - **All Keystrokes (`"all"`)**: Shows every key press including letters, digits, symbols, shortcuts, and navigation.
  - **Shortcuts Only (`"shortcuts"`)**: Shows only modifier combinations and function keys.
  - **Navigational Keys Only (`"navigation"`)**: Shows only navigation keys (`TAB`, arrows, etc.).
- **Cross-Platform (macOS & Windows/Linux)**:
  - Automatically detects macOS (`CMD`, `ALT`, `SHIFT`, `CTRL`) vs. Windows/Linux (`CTRL`, `ALT`, `SHIFT`, `WIN`).
  - Override explicitly with `platform="mac"` or `platform="windows"`.
- **Two Built-In Themes with Light & Dark Variants**:
  - **Apple Keyboard (`theme="apple"`)**: Mimics the physical keys of an Apple Keyboard—white rounded squares with grey text in light mode; black rounded squares with lightgrey text in dark mode.
  - **Mechanical Keyboard (`theme="mechanical"`)**: Sculpted 3D keycap dish with monospace legends and accented modifier keys in both light and dark modes.
  - Supports automatic `light-dark()` adaptation or explicit `color-scheme="light"` / `color-scheme="dark"`.
- **Highly Stylable**:
  - Customize with CSS Custom Properties (`--key-stroke-key-bg`, `--key-stroke-key-color`, `--key-stroke-key-radius`, etc.) or Shadow DOM parts (`::part(key)`, `::part(modifier)`, `::part(primary)`, `::part(separator)`).

---

## Installation & Setup

### 1. Using npm

```bash
npm install key-stroke
```

Import the module to automatically register `<key-stroke>`:

```javascript
import 'key-stroke';
```

### 2. Using a CDN

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/key-stroke/index.js"></script>
```

---

## Usage

### Live Keystroke Visualizer

```html
<!-- Default: shows shortcuts and navigational keys -->
<key-stroke></key-stroke>

<!-- Show all keystrokes -->
<key-stroke filter="all"></key-stroke>

<!-- Show only shortcuts -->
<key-stroke filter="shortcuts"></key-stroke>

<!-- Show only navigational keys -->
<key-stroke filter="navigation"></key-stroke>
```

### Themes & Light/Dark Variants

```html
<!-- Apple Keyboard (Light & Dark) -->
<key-stroke theme="apple" color-scheme="light"></key-stroke>
<key-stroke theme="apple" color-scheme="dark"></key-stroke>

<!-- Mechanical Keyboard (Light & Dark) -->
<key-stroke theme="mechanical" color-scheme="light"></key-stroke>
<key-stroke theme="mechanical" color-scheme="dark"></key-stroke>
```

### Sizing (`size` & CSS `font-size`)

Use the `size` attribute (`small`, `medium`, `large`, `x-large`, `xx-large` — defaults to `large`) to adjust the base `font-size` of the component, or omit the `size` attribute and set `font-size` directly via CSS:

```html
<key-stroke size="small"></key-stroke>
<key-stroke size="medium"></key-stroke>
<key-stroke size="large"></key-stroke>
<key-stroke size="x-large"></key-stroke>
<key-stroke size="xx-large"></key-stroke>
```

```css
/* When no size attribute is set, setting font-size scales the entire component */
key-stroke {
  font-size: 1.5rem;
}
```

### Viewport & Pointer Positioning (`position`)

Set the `position` attribute using any combination of `top` / `center` / `bottom` and `left` / `center` / `right`:

1. **Fixed Viewport Positioning**: Applies `position: fixed` at that viewport location with a `1rem` gap (customizable via `--key-stroke-position-offset`):
   ```html
   <!-- Fixed in the top-right corner of the viewport -->
   <key-stroke position="top right"></key-stroke>

   <!-- Fixed at the bottom-center of the viewport -->
   <key-stroke position="bottom center"></key-stroke>
   ```
2. **Pointer Positioning (CSS Anchor Positioning)**: Prefix `position` with `pointer` to anchor `<key-stroke>` to an invisible `#keystroke-anchor` tracking the pointer via CSS Anchor Positioning (`position-area` + `position-try-fallbacks: flip-inline, flip-block, flip-inline flip-block`). When setting only `pointer`, it defaults to `pointer bottom right`:
   ```html
   <!-- Defaults to bottom right of the pointer -->
   <key-stroke position="pointer"></key-stroke>

   <!-- Positioned to the top right of the pointer -->
   <key-stroke position="pointer top right"></key-stroke>
   ```

Accepted values:
- Viewport: `top left`, `top center`, `top right`, `center left`, `center center`, `center right`, `bottom left`, `bottom center`, `bottom right`
- Pointer: `pointer`, `pointer <top|center|bottom> <left|center|right>`

### Auto-Hide Timeout & Fade-Out Duration (`timeout` & `fade-duration`)

By default, a pressed keystroke stays visible for **`1500` ms** (`timeout`) and then fades out smoothly over **`300` ms** (`fade-duration` / `fade-out`). Both values are numbers expressed in milliseconds and can be customized via attributes or JS properties:

```html
<!-- Wait 2500ms before fading out over 500ms -->
<key-stroke timeout="2500" fade-duration="500"></key-stroke>

<!-- Disable auto-hiding by setting timeout="0" -->
<key-stroke timeout="0"></key-stroke>
```

### Static / Declarative Keycaps

Use `keys` and `static` to render static keycaps in documentation:

```html
<key-stroke keys="→" theme="apple" static></key-stroke>
<key-stroke keys="SHIFT + TAB" theme="apple" static></key-stroke>
<key-stroke keys="CMD + A" theme="apple" static></key-stroke>
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
| `--key-stroke-key-bg` | Keycap background color |
| `--key-stroke-key-color` | Keycap text color |
| `--key-stroke-key-border` | Keycap border shorthand |
| `--key-stroke-key-radius` | Keycap border radius (default `8px` for `apple`) |
| `--key-stroke-key-shadow` | Keycap box shadow |
| `--key-stroke-key-min-size` | Minimum width and height of square keycaps (default `2.75rem`) |
| `--key-stroke-modifier-bg` | Background override for modifier keys |
| `--key-stroke-modifier-color` | Text color override for modifier keys |
| `--key-stroke-separator-color` | Color of the `+` separator |
| `--key-stroke-position-offset` | Viewport edge gap when `position` is set (default `1rem`) |

---

## License

MIT © [Bramus Van Damme](https://www.bram.us/)

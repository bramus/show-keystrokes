/**
 * Interactive Playground & Demo controller for <key-stroke>.
 */

const visualizer = document.getElementById('playground-visualizer');
const stage = document.getElementById('visualizer-stage');
const markupPreview = document.getElementById('active-markup-preview');

const selectFilter = document.getElementById('select-filter');
const selectTheme = document.getElementById('select-theme');
const selectScheme = document.getElementById('select-scheme');
const selectPlatform = document.getElementById('select-platform');
const selectSize = document.getElementById('select-size');
const selectPosition = document.getElementById('select-position');
const inputTimeout = document.getElementById('input-timeout');
const inputFadeDuration = document.getElementById('input-fade-duration');
const btnClear = document.getElementById('btn-clear-visualizer');

function updatePlaygroundAttributes() {
  if (!visualizer) return;

  const filterVal = selectFilter.value;
  const themeVal = selectTheme.value;
  const schemeVal = selectScheme.value;
  const platformVal = selectPlatform.value;
  const sizeVal = selectSize ? selectSize.value : 'large';
  const positionVal = selectPosition ? selectPosition.value : '';
  const timeoutVal = inputTimeout ? inputTimeout.value.trim() : '1500';
  const fadeDurationVal = inputFadeDuration ? inputFadeDuration.value.trim() : '300';

  visualizer.setAttribute('filter', filterVal);
  visualizer.setAttribute('theme', themeVal);

  if (schemeVal === 'auto') {
    visualizer.removeAttribute('color-scheme');
    stage.setAttribute('data-stage-scheme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } else {
    visualizer.setAttribute('color-scheme', schemeVal);
    stage.setAttribute('data-stage-scheme', schemeVal);
  }

  if (platformVal === 'auto') {
    visualizer.removeAttribute('platform');
  } else {
    visualizer.setAttribute('platform', platformVal);
  }

  if (!sizeVal || sizeVal === 'large') {
    visualizer.removeAttribute('size');
  } else {
    visualizer.setAttribute('size', sizeVal);
  }

  if (!positionVal) {
    visualizer.removeAttribute('position');
  } else {
    visualizer.setAttribute('position', positionVal);
  }

  if (timeoutVal === '' || timeoutVal === '1500') {
    visualizer.removeAttribute('timeout');
  } else {
    visualizer.setAttribute('timeout', timeoutVal);
  }

  if (fadeDurationVal === '' || fadeDurationVal === '300') {
    visualizer.removeAttribute('fade-duration');
  } else {
    visualizer.setAttribute('fade-duration', fadeDurationVal);
  }

  const attrs = [
    `theme="${themeVal}"`,
    schemeVal !== 'auto' ? `color-scheme="${schemeVal}"` : '',
    filterVal !== 'shortcuts, navigation' ? `filter="${filterVal}"` : '',
    platformVal !== 'auto' ? `platform="${platformVal}"` : '',
    sizeVal && sizeVal !== 'large' ? `size="${sizeVal}"` : '',
    positionVal ? `position="${positionVal}"` : '',
    timeoutVal && timeoutVal !== '1500' ? `timeout="${timeoutVal}"` : '',
    fadeDurationVal && fadeDurationVal !== '300' ? `fade-duration="${fadeDurationVal}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (markupPreview) {
    markupPreview.textContent = `<key-stroke ${attrs}></key-stroke>`;
  }
}

selectFilter?.addEventListener('change', updatePlaygroundAttributes);
selectTheme?.addEventListener('change', updatePlaygroundAttributes);
selectScheme?.addEventListener('change', updatePlaygroundAttributes);
selectPlatform?.addEventListener('change', updatePlaygroundAttributes);
selectSize?.addEventListener('change', updatePlaygroundAttributes);
selectPosition?.addEventListener('change', updatePlaygroundAttributes);
inputTimeout?.addEventListener('input', updatePlaygroundAttributes);
inputFadeDuration?.addEventListener('input', updatePlaygroundAttributes);

btnClear?.addEventListener('click', () => {
  visualizer?.clear();
});

document.querySelectorAll('.preset-btn[data-sim-key]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-sim-key');
    const shiftKey = btn.getAttribute('data-sim-shift') === 'true';
    const primaryMod = btn.getAttribute('data-sim-primary-mod') === 'true';
    const allOnly = btn.getAttribute('data-sim-all-only') === 'true';

    if (allOnly && selectFilter && selectFilter.value !== 'all') {
      selectFilter.value = 'all';
      updatePlaygroundAttributes();
    }

    const effectivePlatform = visualizer?.platform || 'mac';
    const isMac = effectivePlatform === 'mac';

    let eventCode = key;
    if (key === ' ') {
      eventCode = 'Space';
    } else if (key.length === 1) {
      eventCode = `Key${key.toUpperCase()}`;
    }

    const syntheticEvent = new KeyboardEvent('keydown', {
      key,
      code: eventCode,
      shiftKey,
      metaKey: primaryMod && isMac,
      ctrlKey: primaryMod && !isMac,
      bubbles: true,
    });

    window.dispatchEvent(syntheticEvent);
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    }, 150);
  });
});

// Click-to-capture keystrokes on the playground stage:
// When #visualizer-stage has focus, prevent keystrokes from bubbling up or triggering
// default browser behavior (such as SPACE or arrow keys scrolling the page).
const captureBadge = document.getElementById('stage-capture-badge');
const captureHint = document.getElementById('stage-capture-hint');

if (stage) {
  stage.addEventListener('click', () => {
    stage.focus();
  });

  stage.addEventListener('focus', () => {
    if (captureBadge) {
      captureBadge.textContent = 'Capturing keys (focused)';
    }
    if (captureHint) {
      captureHint.textContent = 'Focused — keystrokes are captured & prevented from scrolling the page (click outside to release)';
    }
  });

  stage.addEventListener('blur', () => {
    if (captureBadge) {
      captureBadge.textContent = 'Click to capture keys';
    }
    if (captureHint) {
      captureHint.textContent = 'Click this area to focus & capture keys (prevents SPACE or arrows from scrolling the page)';
    }
  });

  stage.addEventListener('keydown', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  stage.addEventListener('keyup', (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
}

/**
 * Create SVG icon for <micro-lighter> copy buttons (matching rich-input demo).
 */
function createCopyIconSvg(isCopied = false) {
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  svg.style.margin = 'auto';

  if (isCopied) {
    svg.style.color = '#16a34a';
    const polyline = document.createElementNS(svgNs, 'polyline');
    polyline.setAttribute('points', '20 6 9 17 4 12');
    svg.appendChild(polyline);
  } else {
    const rect = document.createElementNS(svgNs, 'rect');
    rect.setAttribute('x', '9');
    rect.setAttribute('y', '9');
    rect.setAttribute('width', '13');
    rect.setAttribute('height', '13');
    rect.setAttribute('rx', '2');
    rect.setAttribute('ry', '2');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
    svg.append(rect, path);
  }

  return svg;
}

/**
 * Enhance <micro-lighter> copy buttons with SVG icons.
 */
function setupMicroLighterCopyButtons() {
  if (typeof customElements === 'undefined') return;

  const enhanceAll = () => {
    document.querySelectorAll('micro-lighter').forEach((lighter) => {
      const button = lighter.shadowRoot?.querySelector('button[part="copy-button"]');
      if (!button || button.dataset.iconEnhanced === 'true') return;
      button.dataset.iconEnhanced = 'true';

      let currentLabel = 'Copy code';
      const renderIcon = (label) => {
        currentLabel = String(label || 'Copy');
        const isCopied = currentLabel.toLowerCase().includes('copied');
        button.setAttribute('aria-label', isCopied ? 'Copied' : 'Copy code');
        button.setAttribute('title', isCopied ? 'Copied' : 'Copy code');
        button.replaceChildren(createCopyIconSvg(isCopied));
      };

      Object.defineProperty(button, 'textContent', {
        configurable: true,
        get() {
          return currentLabel;
        },
        set(value) {
          renderIcon(value);
        },
      });

      renderIcon('Copy');
    });
  };

  if (customElements.get('micro-lighter')) {
    enhanceAll();
  } else {
    customElements.whenDefined('micro-lighter').then(enhanceAll);
  }
}

/**
 * Setup IntersectionObserver scrollspy for sticky sidebar navigation.
 */
function setupScrollspy() {
  const navLinks = document.querySelectorAll('.sidenav-list a');
  const sections = Array.from(navLinks)
    .map((link) => {
      const id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    })
    .filter(Boolean);

  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('is-active');
            } else {
              link.classList.remove('is-active');
            }
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  sections.forEach((sec) => observer.observe(sec));
}

setupMicroLighterCopyButtons();
setupScrollspy();

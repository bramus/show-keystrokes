/**
 * Interactive Playground & Demo controller for <show-keystrokes>.
 */

const visualizer = document.getElementById('playground-visualizer');
const stage = document.getElementById('visualizer-stage');
const stagePromptMain = document.getElementById('stage-prompt-main');
const playgroundCodeContainer = document.getElementById('playground-code-container');

const selectKeystrokes = document.getElementById('select-keystrokes');
const selectTheme = document.getElementById('select-theme');
const selectScheme = document.getElementById('select-scheme');
const selectPlatform = document.getElementById('select-platform');
const selectSize = document.getElementById('select-size');
const selectPositionAnchor = document.getElementById('select-position-anchor');
const selectPositionArea = document.getElementById('select-position-area');
const inputHideDelay = document.getElementById('input-hide-delay');
const inputHideDuration = document.getElementById('input-hide-duration');
const selectDisabled = document.getElementById('select-disabled');

function renderDefaultStagePromptMain() {
  if (!stagePromptMain) return;
  const codeArrow = document.createElement('code');
  codeArrow.textContent = '→';
  const codeShiftTab = document.createElement('code');
  codeShiftTab.textContent = 'SHIFT + TAB';
  const codeCmdA = document.createElement('code');
  codeCmdA.textContent = 'CMD + A';
  stagePromptMain.replaceChildren(
    document.createTextNode('Press a shortcut or arrow key (e.g. '),
    codeArrow,
    document.createTextNode(', '),
    codeShiftTab,
    document.createTextNode(', '),
    codeCmdA,
    document.createTextNode(')…')
  );
}

function syncStagePrompt() {
  if (!stagePromptMain || !visualizer) return;

  const isActive = visualizer.hasAttribute('active');
  const currentPosition = visualizer.position || 'viewport top right';

  if (isActive && currentPosition !== 'normal') {
    const codePos = document.createElement('code');
    codePos.textContent = currentPosition;
    stagePromptMain.replaceChildren(
      document.createTextNode('Keystroke is being shown at '),
      codePos
    );
  } else {
    renderDefaultStagePromptMain();
  }
}

if (visualizer && typeof MutationObserver === 'function') {
  const observer = new MutationObserver(() => {
    syncStagePrompt();
  });
  observer.observe(visualizer, {
    attributes: true,
    attributeFilter: ['active', 'position'],
  });
}

function updatePlaygroundAttributes() {
  if (!visualizer) return;

  const keystrokesVal = selectKeystrokes ? selectKeystrokes.value : '';
  const themeVal = selectTheme.value;
  const schemeVal = selectScheme.value;
  const platformVal = selectPlatform.value;
  const sizeVal = selectSize ? selectSize.value : 'large';
  const positionAnchorVal = selectPositionAnchor ? selectPositionAnchor.value : 'normal';
  const positionAreaVal = selectPositionArea ? selectPositionArea.value : 'top right';
  const hideDelayVal = inputHideDelay ? inputHideDelay.value.trim() : '1250';
  const hideDurationVal = inputHideDuration ? inputHideDuration.value.trim() : '200';
  const isDisabled = selectDisabled ? selectDisabled.value === 'true' : false;

  if (selectPositionArea) {
    selectPositionArea.disabled = positionAnchorVal === 'normal';
  }

  let positionVal = '';
  if (positionAnchorVal === 'normal') {
    positionVal = 'normal';
  } else if (positionAnchorVal === 'pointer') {
    positionVal = positionAreaVal === 'bottom right' ? 'pointer' : `pointer ${positionAreaVal}`;
  } else if (positionAnchorVal === 'viewport') {
    positionVal = positionAreaVal === 'top right' ? '' : `viewport ${positionAreaVal}`;
  }

  if (!keystrokesVal) {
    visualizer.removeAttribute('keystrokes');
  } else {
    visualizer.setAttribute('keystrokes', keystrokesVal);
  }
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

  if (hideDelayVal === '' || hideDelayVal === '1250') {
    visualizer.removeAttribute('hide-delay');
  } else {
    visualizer.setAttribute('hide-delay', hideDelayVal);
  }

  if (hideDurationVal === '' || hideDurationVal === '200') {
    visualizer.removeAttribute('hide-duration');
  } else {
    visualizer.setAttribute('hide-duration', hideDurationVal);
  }

  visualizer.disabled = isDisabled;

  const attrs = [
    keystrokesVal ? `keystrokes="${keystrokesVal}"` : '',
    positionVal ? `position="${positionVal}"` : '',
    `theme="${themeVal}"`,
    schemeVal !== 'auto' ? `color-scheme="${schemeVal}"` : '',
    sizeVal && sizeVal !== 'large' ? `size="${sizeVal}"` : '',
    hideDelayVal && hideDelayVal !== '1250' ? `hide-delay="${hideDelayVal}"` : '',
    hideDurationVal && hideDurationVal !== '200' ? `hide-duration="${hideDurationVal}"` : '',
    platformVal !== 'auto' ? `platform="${platformVal}"` : '',
    isDisabled ? 'disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (playgroundCodeContainer) {
    const lighter = document.createElement('micro-lighter');
    lighter.setAttribute('language', 'html');
    lighter.setAttribute('controls', 'copy');
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.id = 'active-markup-preview';
    code.textContent = `<show-keystrokes ${attrs}></show-keystrokes>`;
    pre.appendChild(code);
    lighter.appendChild(pre);
    playgroundCodeContainer.replaceChildren(lighter);
    setupMicroLighterCopyButtons();
  }

  syncStagePrompt();
}

selectKeystrokes?.addEventListener('change', updatePlaygroundAttributes);
selectTheme?.addEventListener('change', updatePlaygroundAttributes);
selectScheme?.addEventListener('change', updatePlaygroundAttributes);
selectPlatform?.addEventListener('change', updatePlaygroundAttributes);
selectSize?.addEventListener('change', updatePlaygroundAttributes);
selectPositionAnchor?.addEventListener('change', updatePlaygroundAttributes);
selectPositionArea?.addEventListener('change', updatePlaygroundAttributes);
inputHideDelay?.addEventListener('input', updatePlaygroundAttributes);
inputHideDuration?.addEventListener('input', updatePlaygroundAttributes);
selectDisabled?.addEventListener('change', updatePlaygroundAttributes);

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

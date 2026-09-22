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
const selectNotation = document.getElementById('select-notation');
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
  const notationVal = selectNotation ? selectNotation.value : 'symbols';
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

  if (!notationVal || notationVal === 'symbols') {
    visualizer.removeAttribute('notation');
  } else {
    visualizer.setAttribute('notation', notationVal);
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
    notationVal && notationVal !== 'symbols' ? `notation="${notationVal}"` : '',
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
selectNotation?.addEventListener('change', updatePlaygroundAttributes);
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

/**
 * Interactive CSS Custom Properties Styler in #stylability
 */
function setupCustomPropsStyler() {
  const target = document.getElementById('custom-props-visualizer');
  const codeContainer = document.getElementById('custom-props-code-container');
  const resetBtn = document.getElementById('btn-reset-custom-props');

  if (!target) return;

  const cpKeyBg = document.getElementById('cp-key-bg');
  const cpKeyBgImage = document.getElementById('cp-key-bg-image');
  const cpKeyColor = document.getElementById('cp-key-color');
  const cpBorderWidth = document.getElementById('cp-border-width');
  const cpBorderUnit = document.getElementById('cp-border-unit');
  const cpBorderColor = document.getElementById('cp-border-color');
  const cpKeyShadow = document.getElementById('cp-key-shadow');

  const cpModBg = document.getElementById('cp-mod-bg');
  const cpModBgImage = document.getElementById('cp-mod-bg-image');
  const cpModColor = document.getElementById('cp-mod-color');

  const cpMinSizeVal = document.getElementById('cp-min-size-val');
  const cpMinSizeUnit = document.getElementById('cp-min-size-unit');
  const cpRadiusVal = document.getElementById('cp-radius-val');
  const cpRadiusUnit = document.getElementById('cp-radius-unit');
  const cpPaddingVal = document.getElementById('cp-padding-val');
  const cpPaddingUnit = document.getElementById('cp-padding-unit');
  const cpGapVal = document.getElementById('cp-gap-val');
  const cpGapUnit = document.getElementById('cp-gap-unit');
  const cpPosOffsetVal = document.getElementById('cp-pos-offset-val');
  const cpPosOffsetUnit = document.getElementById('cp-pos-offset-unit');
  const cpPointerGapVal = document.getElementById('cp-pointer-gap-val');
  const cpPointerGapUnit = document.getElementById('cp-pointer-gap-unit');
  const cpAnchorSizeVal = document.getElementById('cp-anchor-size-val');
  const cpAnchorSizeUnit = document.getElementById('cp-anchor-size-unit');

  const cpFontFamily = document.getElementById('cp-font-family');
  const cpFontSizeVal = document.getElementById('cp-font-size-val');
  const cpFontSizeUnit = document.getElementById('cp-font-size-unit');
  const cpFontWeight = document.getElementById('cp-font-weight');

  const cpSepColor = document.getElementById('cp-sep-color');
  const cpSepSizeVal = document.getElementById('cp-sep-size-val');
  const cpSepSizeUnit = document.getElementById('cp-sep-size-unit');
  const cpSepDisplay = document.getElementById('cp-sep-display');

  const cpPointerEvents = document.getElementById('cp-pointer-events');
  const cpHideDurationVal = document.getElementById('cp-hide-duration-val');
  const cpHideDurationUnit = document.getElementById('cp-hide-duration-unit');

  const DEFAULTS = {
    keyBg: '#ffffff',
    keyColor: '#515154',
    borderWidth: '1',
    borderUnit: 'px',
    borderColor: '#d2d2d7',
    modBg: '#eff6ff',
    modColor: '#1d4ed8',
    minSizeVal: '2.75',
    minSizeUnit: 'em',
    radiusVal: '0.5',
    radiusUnit: 'em',
    paddingVal: '0.65',
    paddingUnit: 'em',
    gapVal: '0.375',
    gapUnit: 'em',
    posOffsetVal: '1',
    posOffsetUnit: 'rem',
    pointerGapVal: '0.25',
    pointerGapUnit: 'rem',
    anchorSizeVal: '1.25',
    anchorSizeUnit: 'rem',
    fontSizeVal: '0.875',
    fontSizeUnit: 'em',
    fontWeight: '600',
    sepColor: '#86868b',
    sepSizeVal: '0.875',
    sepSizeUnit: 'em',
    sepDisplay: 'inline-flex',
    pointerEvents: 'none',
    hideDurationVal: '200',
    hideDurationUnit: 'ms',
  };

  function markColorCustomized(inputEl, hexId, wrapId) {
    if (!inputEl) return;
    inputEl.dataset.customized = 'true';
    const hexEl = document.getElementById(hexId);
    const wrapEl = document.getElementById(wrapId);
    if (hexEl) hexEl.textContent = inputEl.value;
    if (wrapEl) wrapEl.classList.add('is-customized');
  }

  function resetColorState(inputEl, defaultHex, defaultLabel, hexId, wrapId) {
    if (!inputEl) return;
    delete inputEl.dataset.customized;
    inputEl.value = defaultHex;
    const hexEl = document.getElementById(hexId);
    const wrapEl = document.getElementById(wrapId);
    if (hexEl) hexEl.textContent = defaultLabel;
    if (wrapEl) wrapEl.classList.remove('is-customized');
  }

  function convertLengthValue(numVal, fromUnit, toUnit) {
    if (!Number.isFinite(numVal) || fromUnit === toUnit) return numVal;
    if (fromUnit === 'ms' && toUnit === 's') {
      return Number((numVal / 1000).toFixed(3));
    }
    if (fromUnit === 's' && toUnit === 'ms') {
      return Math.round(numVal * 1000);
    }
    const px = fromUnit === 'px' ? numVal : numVal * 16;
    const converted = toUnit === 'px' ? Math.round(px) : Number((px / 16).toFixed(3));
    return converted;
  }

  function bindUnitPair(numInput, unitSelect) {
    if (!numInput || !unitSelect) return;
    unitSelect.dataset.prevUnit = unitSelect.value;

    unitSelect.addEventListener('change', () => {
      const prevUnit = unitSelect.dataset.prevUnit || 'em';
      const nextUnit = unitSelect.value;
      const raw = parseFloat(numInput.value);
      if (Number.isFinite(raw)) {
        numInput.value = String(convertLengthValue(raw, prevUnit, nextUnit));
      }
      numInput.step = nextUnit === 'px' ? '1' : nextUnit === 'ms' ? '10' : '0.05';
      unitSelect.dataset.prevUnit = nextUnit;
      updateCustomProps();
    });

    numInput.addEventListener('input', updateCustomProps);
  }

  bindUnitPair(cpBorderWidth, cpBorderUnit);
  bindUnitPair(cpMinSizeVal, cpMinSizeUnit);
  bindUnitPair(cpRadiusVal, cpRadiusUnit);
  bindUnitPair(cpPaddingVal, cpPaddingUnit);
  bindUnitPair(cpGapVal, cpGapUnit);
  bindUnitPair(cpPosOffsetVal, cpPosOffsetUnit);
  bindUnitPair(cpPointerGapVal, cpPointerGapUnit);
  bindUnitPair(cpAnchorSizeVal, cpAnchorSizeUnit);
  bindUnitPair(cpFontSizeVal, cpFontSizeUnit);
  bindUnitPair(cpSepSizeVal, cpSepSizeUnit);
  bindUnitPair(cpHideDurationVal, cpHideDurationUnit);

  cpKeyBg?.addEventListener('input', () => {
    markColorCustomized(cpKeyBg, 'hex-cp-key-bg', 'wrap-cp-key-bg');
    if (cpKeyBgImage && cpKeyBgImage.value === '') {
      cpKeyBgImage.value = 'none';
    }
    updateCustomProps();
  });

  cpKeyColor?.addEventListener('input', () => {
    markColorCustomized(cpKeyColor, 'hex-cp-key-color', 'wrap-cp-key-color');
    updateCustomProps();
  });

  cpBorderColor?.addEventListener('input', () => {
    cpBorderColor.dataset.customized = 'true';
    cpBorderColor.closest('.color-control')?.classList.add('is-customized');
    updateCustomProps();
  });

  cpModBg?.addEventListener('input', () => {
    markColorCustomized(cpModBg, 'hex-cp-mod-bg', 'wrap-cp-mod-bg');
    if (cpModBgImage && cpModBgImage.value === '') {
      cpModBgImage.value = 'none';
    }
    updateCustomProps();
  });

  cpModColor?.addEventListener('input', () => {
    markColorCustomized(cpModColor, 'hex-cp-mod-color', 'wrap-cp-mod-color');
    updateCustomProps();
  });

  cpSepColor?.addEventListener('input', () => {
    markColorCustomized(cpSepColor, 'hex-cp-sep-color', 'wrap-cp-sep-color');
    updateCustomProps();
  });

  [
    cpKeyBgImage,
    cpKeyShadow,
    cpModBgImage,
    cpFontFamily,
    cpFontWeight,
    cpSepDisplay,
    cpPointerEvents,
  ].forEach((sel) => sel?.addEventListener('change', updateCustomProps));

  function setOrRemoveProp(propName, value, isDefault) {
    if (isDefault || value === '' || value === null || value === undefined) {
      target.style.removeProperty(propName);
      return null;
    }
    target.style.setProperty(propName, value);
    return `  ${propName}: ${value};`;
  }

  function updateCustomProps() {
    const cssLines = [];

    // 1. Key background & bg-image
    const keyBgCustomized = cpKeyBg?.dataset.customized === 'true';
    const lineKeyBg = setOrRemoveProp('--show-keystrokes-key-bg', cpKeyBg?.value, !keyBgCustomized);
    if (lineKeyBg) cssLines.push(lineKeyBg);

    const lineKeyBgImage = setOrRemoveProp(
      '--show-keystrokes-key-bg-image',
      cpKeyBgImage?.value,
      !cpKeyBgImage?.value
    );
    if (lineKeyBgImage) cssLines.push(lineKeyBgImage);

    // 2. Key text color
    const keyColorCustomized = cpKeyColor?.dataset.customized === 'true';
    const lineKeyColor = setOrRemoveProp(
      '--show-keystrokes-key-color',
      cpKeyColor?.value,
      !keyColorCustomized
    );
    if (lineKeyColor) cssLines.push(lineKeyColor);

    // 3. Key border
    const borderW = cpBorderWidth?.value.trim() ?? '1';
    const borderU = cpBorderUnit?.value ?? 'px';
    const borderC = cpBorderColor?.value ?? DEFAULTS.borderColor;
    const borderCustomized =
      borderW !== DEFAULTS.borderWidth ||
      borderU !== DEFAULTS.borderUnit ||
      cpBorderColor?.dataset.customized === 'true';
    const borderValue = Number(borderW) === 0 ? 'none' : `${borderW}${borderU} solid ${borderC}`;
    const lineBorder = setOrRemoveProp('--show-keystrokes-key-border', borderValue, !borderCustomized);
    if (lineBorder) cssLines.push(lineBorder);

    // 4. Key shadow
    const lineShadow = setOrRemoveProp(
      '--show-keystrokes-key-shadow',
      cpKeyShadow?.value,
      !cpKeyShadow?.value
    );
    if (lineShadow) cssLines.push(lineShadow);

    // 5. Dimensions & Spacing (Lengths)
    const minSizeW = cpMinSizeVal?.value.trim() ?? DEFAULTS.minSizeVal;
    const minSizeU = cpMinSizeUnit?.value ?? DEFAULTS.minSizeUnit;
    const lineMinSize = setOrRemoveProp(
      '--show-keystrokes-key-min-size',
      `${minSizeW}${minSizeU}`,
      minSizeW === DEFAULTS.minSizeVal && minSizeU === DEFAULTS.minSizeUnit
    );
    if (lineMinSize) cssLines.push(lineMinSize);

    const radiusW = cpRadiusVal?.value.trim() ?? DEFAULTS.radiusVal;
    const radiusU = cpRadiusUnit?.value ?? DEFAULTS.radiusUnit;
    const lineRadius = setOrRemoveProp(
      '--show-keystrokes-key-radius',
      `${radiusW}${radiusU}`,
      radiusW === DEFAULTS.radiusVal && radiusU === DEFAULTS.radiusUnit
    );
    if (lineRadius) cssLines.push(lineRadius);

    const padW = cpPaddingVal?.value.trim() ?? DEFAULTS.paddingVal;
    const padU = cpPaddingUnit?.value ?? DEFAULTS.paddingUnit;
    const linePadding = setOrRemoveProp(
      '--show-keystrokes-key-padding',
      `0 ${padW}${padU}`,
      padW === DEFAULTS.paddingVal && padU === DEFAULTS.paddingUnit
    );
    if (linePadding) cssLines.push(linePadding);

    const gapW = cpGapVal?.value.trim() ?? DEFAULTS.gapVal;
    const gapU = cpGapUnit?.value ?? DEFAULTS.gapUnit;
    const lineGap = setOrRemoveProp(
      '--show-keystrokes-gap',
      `${gapW}${gapU}`,
      gapW === DEFAULTS.gapVal && gapU === DEFAULTS.gapUnit
    );
    if (lineGap) cssLines.push(lineGap);

    // 6. Modifier overrides
    const modBgCustomized = cpModBg?.dataset.customized === 'true';
    const lineModBg = setOrRemoveProp('--show-keystrokes-modifier-bg', cpModBg?.value, !modBgCustomized);
    if (lineModBg) cssLines.push(lineModBg);

    const lineModBgImage = setOrRemoveProp(
      '--show-keystrokes-modifier-bg-image',
      cpModBgImage?.value,
      !cpModBgImage?.value
    );
    if (lineModBgImage) cssLines.push(lineModBgImage);

    const modColorCustomized = cpModColor?.dataset.customized === 'true';
    const lineModColor = setOrRemoveProp(
      '--show-keystrokes-modifier-color',
      cpModColor?.value,
      !modColorCustomized
    );
    if (lineModColor) cssLines.push(lineModColor);

    // 7. Typography & Separator
    const lineFontFamily = setOrRemoveProp(
      '--show-keystrokes-key-font-family',
      cpFontFamily?.value,
      !cpFontFamily?.value
    );
    if (lineFontFamily) cssLines.push(lineFontFamily);

    const fontSizeW = cpFontSizeVal?.value.trim() ?? DEFAULTS.fontSizeVal;
    const fontSizeU = cpFontSizeUnit?.value ?? DEFAULTS.fontSizeUnit;
    const lineFontSize = setOrRemoveProp(
      '--show-keystrokes-key-font-size',
      `${fontSizeW}${fontSizeU}`,
      fontSizeW === DEFAULTS.fontSizeVal && fontSizeU === DEFAULTS.fontSizeUnit
    );
    if (lineFontSize) cssLines.push(lineFontSize);

    const lineFontWeight = setOrRemoveProp(
      '--show-keystrokes-key-font-weight',
      cpFontWeight?.value,
      cpFontWeight?.value === DEFAULTS.fontWeight
    );
    if (lineFontWeight) cssLines.push(lineFontWeight);

    const sepColorCustomized = cpSepColor?.dataset.customized === 'true';
    const lineSepColor = setOrRemoveProp(
      '--show-keystrokes-separator-color',
      cpSepColor?.value,
      !sepColorCustomized
    );
    if (lineSepColor) cssLines.push(lineSepColor);

    const sepSizeW = cpSepSizeVal?.value.trim() ?? DEFAULTS.sepSizeVal;
    const sepSizeU = cpSepSizeUnit?.value ?? DEFAULTS.sepSizeUnit;
    const lineSepSize = setOrRemoveProp(
      '--show-keystrokes-separator-size',
      `${sepSizeW}${sepSizeU}`,
      sepSizeW === DEFAULTS.sepSizeVal && sepSizeU === DEFAULTS.sepSizeUnit
    );
    if (lineSepSize) cssLines.push(lineSepSize);

    const lineSepDisplay = setOrRemoveProp(
      '--show-keystrokes-separator-display',
      cpSepDisplay?.value,
      cpSepDisplay?.value === DEFAULTS.sepDisplay
    );
    if (lineSepDisplay) cssLines.push(lineSepDisplay);

    // 8. Positioning and behavior
    const posOffsetW = cpPosOffsetVal?.value.trim() ?? DEFAULTS.posOffsetVal;
    const posOffsetU = cpPosOffsetUnit?.value ?? DEFAULTS.posOffsetUnit;
    const linePosOffset = setOrRemoveProp(
      '--show-keystrokes-position-offset',
      `${posOffsetW}${posOffsetU}`,
      posOffsetW === DEFAULTS.posOffsetVal && posOffsetU === DEFAULTS.posOffsetUnit
    );
    if (linePosOffset) cssLines.push(linePosOffset);

    const pointerGapW = cpPointerGapVal?.value.trim() ?? DEFAULTS.pointerGapVal;
    const pointerGapU = cpPointerGapUnit?.value ?? DEFAULTS.pointerGapUnit;
    const linePointerGap = setOrRemoveProp(
      '--show-keystrokes-pointer-gap',
      `${pointerGapW}${pointerGapU}`,
      pointerGapW === DEFAULTS.pointerGapVal && pointerGapU === DEFAULTS.pointerGapUnit
    );
    if (linePointerGap) cssLines.push(linePointerGap);

    const anchorSizeW = cpAnchorSizeVal?.value.trim() ?? DEFAULTS.anchorSizeVal;
    const anchorSizeU = cpAnchorSizeUnit?.value ?? DEFAULTS.anchorSizeUnit;
    const lineAnchorSize = setOrRemoveProp(
      '--show-keystrokes-anchor-size',
      `${anchorSizeW}${anchorSizeU}`,
      anchorSizeW === DEFAULTS.anchorSizeVal && anchorSizeU === DEFAULTS.anchorSizeUnit
    );
    if (lineAnchorSize) cssLines.push(lineAnchorSize);

    const linePointerEvents = setOrRemoveProp(
      '--show-keystrokes-pointer-events',
      cpPointerEvents?.value,
      cpPointerEvents?.value === DEFAULTS.pointerEvents
    );
    if (linePointerEvents) cssLines.push(linePointerEvents);

    const hideDurW = cpHideDurationVal?.value.trim() ?? DEFAULTS.hideDurationVal;
    const hideDurU = cpHideDurationUnit?.value ?? DEFAULTS.hideDurationUnit;
    const lineHideDuration = setOrRemoveProp(
      '--show-keystrokes-hide-duration',
      `${hideDurW}${hideDurU}`,
      hideDurW === DEFAULTS.hideDurationVal && hideDurU === DEFAULTS.hideDurationUnit
    );
    if (lineHideDuration) cssLines.push(lineHideDuration);

    // Render CSS preview block
    if (codeContainer) {
      const cssBody =
        cssLines.length > 0
          ? `show-keystrokes {\n${cssLines.join('\n')}\n}`
          : `show-keystrokes {\n  /* Adjust any control above to generate custom property overrides */\n}`;
      const lighter = document.createElement('micro-lighter');
      lighter.setAttribute('language', 'css');
      lighter.setAttribute('controls', 'copy');
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.id = 'custom-props-css-preview';
      code.textContent = cssBody;
      pre.appendChild(code);
      lighter.appendChild(pre);
      codeContainer.replaceChildren(lighter);
      setupMicroLighterCopyButtons();
    }
  }

  resetBtn?.addEventListener('click', () => {
    resetColorState(cpKeyBg, DEFAULTS.keyBg, 'Default', 'hex-cp-key-bg', 'wrap-cp-key-bg');
    if (cpKeyBgImage) cpKeyBgImage.value = '';
    resetColorState(cpKeyColor, DEFAULTS.keyColor, 'Default', 'hex-cp-key-color', 'wrap-cp-key-color');

    if (cpBorderWidth) {
      cpBorderWidth.value = DEFAULTS.borderWidth;
      cpBorderWidth.step = '1';
    }
    if (cpBorderUnit) {
      cpBorderUnit.value = DEFAULTS.borderUnit;
      cpBorderUnit.dataset.prevUnit = DEFAULTS.borderUnit;
    }
    if (cpBorderColor) {
      delete cpBorderColor.dataset.customized;
      cpBorderColor.value = DEFAULTS.borderColor;
      cpBorderColor.closest('.color-control')?.classList.remove('is-customized');
    }
    if (cpKeyShadow) cpKeyShadow.value = '';

    resetColorState(cpModBg, DEFAULTS.modBg, 'Default (Inherits)', 'hex-cp-mod-bg', 'wrap-cp-mod-bg');
    if (cpModBgImage) cpModBgImage.value = '';
    resetColorState(cpModColor, DEFAULTS.modColor, 'Default (Inherits)', 'hex-cp-mod-color', 'wrap-cp-mod-color');

    const resetPair = (numEl, unitEl, defVal, defUnit, stepVal) => {
      if (numEl) {
        numEl.value = defVal;
        numEl.step = stepVal || (defUnit === 'px' ? '1' : defUnit === 'ms' ? '10' : '0.05');
      }
      if (unitEl) {
        unitEl.value = defUnit;
        unitEl.dataset.prevUnit = defUnit;
      }
    };

    resetPair(cpMinSizeVal, cpMinSizeUnit, DEFAULTS.minSizeVal, DEFAULTS.minSizeUnit);
    resetPair(cpRadiusVal, cpRadiusUnit, DEFAULTS.radiusVal, DEFAULTS.radiusUnit);
    resetPair(cpPaddingVal, cpPaddingUnit, DEFAULTS.paddingVal, DEFAULTS.paddingUnit);
    resetPair(cpGapVal, cpGapUnit, DEFAULTS.gapVal, DEFAULTS.gapUnit);
    resetPair(cpPosOffsetVal, cpPosOffsetUnit, DEFAULTS.posOffsetVal, DEFAULTS.posOffsetUnit);
    resetPair(cpPointerGapVal, cpPointerGapUnit, DEFAULTS.pointerGapVal, DEFAULTS.pointerGapUnit);
    resetPair(cpAnchorSizeVal, cpAnchorSizeUnit, DEFAULTS.anchorSizeVal, DEFAULTS.anchorSizeUnit);

    if (cpFontFamily) cpFontFamily.value = '';
    resetPair(cpFontSizeVal, cpFontSizeUnit, DEFAULTS.fontSizeVal, DEFAULTS.fontSizeUnit);
    if (cpFontWeight) cpFontWeight.value = DEFAULTS.fontWeight;

    resetColorState(cpSepColor, DEFAULTS.sepColor, 'Default', 'hex-cp-sep-color', 'wrap-cp-sep-color');
    resetPair(cpSepSizeVal, cpSepSizeUnit, DEFAULTS.sepSizeVal, DEFAULTS.sepSizeUnit);
    if (cpSepDisplay) cpSepDisplay.value = DEFAULTS.sepDisplay;

    if (cpPointerEvents) cpPointerEvents.value = DEFAULTS.pointerEvents;
    resetPair(cpHideDurationVal, cpHideDurationUnit, DEFAULTS.hideDurationVal, DEFAULTS.hideDurationUnit, '10');

    updateCustomProps();
  });
}

setupMicroLighterCopyButtons();
setupScrollspy();
setupCustomPropsStyler();

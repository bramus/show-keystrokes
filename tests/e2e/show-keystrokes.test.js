import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../../src');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, 'http://localhost');
        let pathname = decodeURIComponent(reqUrl.pathname);
        if (pathname === '/') pathname = '/index.html';

        const filePath = path.join(rootDir, pathname);
        if (!filePath.startsWith(rootDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const data = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        });
        res.end(data);
      } catch (err) {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

describe('<show-keystrokes> End-to-End Browser Tests (Puppeteer + WebDriver BiDi)', () => {
  let serverInfo;
  let browser;
  let page;

  before(async () => {
    serverInfo = await startStaticServer(SRC_DIR);
    browser = await puppeteer.launch({
      protocol: 'webDriverBiDi',
      headless: true,
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 768 });
    await page.goto(serverInfo.url, { waitUntil: 'networkidle0' });
  });

  after(async () => {
    if (browser) {
      await browser.close();
    }
    if (serverInfo?.server) {
      await new Promise((resolve) => serverInfo.server.close(resolve));
    }
  });

  it('registers <show-keystrokes> and renders sibling ::part(anchor) and ::part(container) elements in Shadow DOM', async () => {
    const info = await page.evaluate(() => {
      const el = document.createElement('show-keystrokes');
      document.body.appendChild(el);
      const children = Array.from(el.shadowRoot.children)
        .filter((c) => c.hasAttribute('part'))
        .map((c) => ({
          tagName: c.tagName,
          className: c.className,
          part: c.getAttribute('part'),
        }));
      el.remove();
      return {
        isDefined: Boolean(customElements.get('show-keystrokes')),
        children,
      };
    });

    assert.equal(info.isDefined, true);
    assert.equal(info.children.length, 2);
    assert.equal(info.children[0].part, 'anchor');
    assert.equal(info.children[1].part, 'container');
  });

  it('renders static keycaps and separators when [static] and [keys] are set, supporting both symbols and text notation', async () => {
    const result = await page.evaluate(() => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('static', '');
      el.setAttribute('platform', 'mac');
      el.setAttribute('keys', 'SHIFT + CMD + K');
      document.body.appendChild(el);

      const container = el.shadowRoot.querySelector('[part="container"]');
      const symbolsParts = Array.from(container.children).map((node) => ({
        text: node.textContent,
        part: node.getAttribute('part'),
      }));
      const hasPopoverWhenStatic = container.hasAttribute('popover');

      el.setAttribute('notation', 'text');
      const textParts = Array.from(container.children).map((node) => ({
        text: node.textContent,
        part: node.getAttribute('part'),
      }));

      el.remove();
      return { symbolsParts, textParts, hasPopoverWhenStatic };
    });

    assert.equal(result.hasPopoverWhenStatic, false);
    assert.deepEqual(result.symbolsParts, [
      { text: '⇧', part: 'key modifier' },
      { text: ' + ', part: 'separator' },
      { text: '⌘', part: 'key modifier' },
      { text: ' + ', part: 'separator' },
      { text: 'K', part: 'key primary' },
    ]);
    assert.deepEqual(result.textParts, [
      { text: 'SHIFT', part: 'key modifier' },
      { text: ' + ', part: 'separator' },
      { text: 'CMD', part: 'key modifier' },
      { text: ' + ', part: 'separator' },
      { text: 'K', part: 'key primary' },
    ]);
  });

  it('promotes ::part(container) to the Top Layer via Popover API in viewport mode (verified via CDP DOM.getTopLayerElements and hit-testing above z-index: 2147483647)', async () => {
    const client = await page.createCDPSession();
    await client.send('DOM.enable');

    // Before showing any keystrokes, no show-keystrokes container should be in the Top Layer
    await client.send('DOM.getDocument', { depth: -1, pierce: true });
    const beforeTopLayer = await client.send('DOM.getTopLayerElements');

    const hitTestAndState = await page.evaluate(() => {
      // Create a full-viewport blocker with maximum 32-bit signed z-index (2147483647)
      const maxZBlocker = document.createElement('div');
      maxZBlocker.id = 'max-z-blocker';
      maxZBlocker.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; background: rgba(0, 0, 0, 0.5);';
      document.body.appendChild(maxZBlocker);

      const el = document.createElement('show-keystrokes');
      el.id = 'top-layer-test-el';
      el.setAttribute('position', 'viewport top right');
      el.setAttribute('hide-delay', '0');
      el.style.setProperty('--show-keystrokes-pointer-events', 'auto');
      document.body.appendChild(el);
      el.showKeys('CMD + K');

      const container = el.shadowRoot.querySelector('[part="container"]');
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // In the light DOM, elementFromPoint at the keystroke overlay's coordinates must hit <show-keystrokes>
      // (not #max-z-blocker), and inside shadowRoot it must hit the popover container/keycap.
      const lightDomHit = document.elementFromPoint(centerX, centerY);
      const shadowDomHit = el.shadowRoot.elementFromPoint(centerX, centerY);

      return {
        isPopoverOpen: container.matches(':popover-open'),
        lightDomHitId: lightDomHit?.id,
        shadowDomInsideContainer: container.contains(shadowDomHit),
      };
    });

    // Query CDP DOM.getTopLayerElements while the viewport keystroke overlay is active
    await client.send('DOM.getDocument', { depth: -1, pierce: true });
    const afterTopLayer = await client.send('DOM.getTopLayerElements');
    const topLayerNodes = await Promise.all(
      afterTopLayer.nodeIds.map((nodeId) => client.send('DOM.describeNode', { nodeId }))
    );

    // Clean up test elements
    await page.evaluate(() => {
      document.getElementById('top-layer-test-el')?.remove();
      document.getElementById('max-z-blocker')?.remove();
    });
    await client.detach();

    assert.equal(hitTestAndState.isPopoverOpen, true);
    assert.equal(hitTestAndState.lightDomHitId, 'top-layer-test-el');
    assert.equal(hitTestAndState.shadowDomInsideContainer, true);
    assert.ok(
      afterTopLayer.nodeIds.length > beforeTopLayer.nodeIds.length,
      'Expected CDP DOM.getTopLayerElements to include the active <show-keystrokes> popover'
    );
    const hasContainerInTopLayer = topLayerNodes.some(({ node }) => {
      const attrs = node.attributes || [];
      const partIdx = attrs.indexOf('part');
      const popoverIdx = attrs.indexOf('popover');
      return (
        node.localName === 'div' &&
        partIdx !== -1 &&
        attrs[partIdx + 1] === 'container' &&
        popoverIdx !== -1 &&
        attrs[popoverIdx + 1] === 'manual'
      );
    });
    assert.equal(hasContainerInTopLayer, true);
  });

  it('positions all 9 viewport positions (plus default "viewport") accurately inside the viewport using getBoundingClientRect()', async () => {
    const measurements = await page.evaluate(() => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('hide-delay', '0');
      document.body.appendChild(el);
      el.showKeys('CMD + K');

      const anchor = el.shadowRoot.querySelector('[part="anchor"]');
      const container = el.shadowRoot.querySelector('[part="container"]');
      const anchorRect = anchor.getBoundingClientRect();

      const positions = [
        'viewport',
        'viewport top left',
        'viewport top center',
        'viewport top right',
        'viewport center left',
        'viewport center center',
        'viewport center right',
        'viewport bottom left',
        'viewport bottom center',
        'viewport bottom right',
      ];

      const rects = {};
      for (const pos of positions) {
        el.setAttribute('position', pos);
        const r = container.getBoundingClientRect();
        const cs = getComputedStyle(container);
        rects[pos] = {
          top: Math.round(r.top),
          left: Math.round(r.left),
          right: Math.round(r.right),
          bottom: Math.round(r.bottom),
          width: Math.round(r.width),
          height: Math.round(r.height),
          centerX: Math.round(r.left + r.width / 2),
          centerY: Math.round(r.top + r.height / 2),
          rightGap: Math.round(window.innerWidth - r.right),
          bottomGap: Math.round(window.innerHeight - r.bottom),
          alignSelf: cs.alignSelf,
          justifySelf: cs.justifySelf,
        };
      }

      el.remove();
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        anchorRect: {
          x: anchorRect.x,
          y: anchorRect.y,
          width: anchorRect.width,
          height: anchorRect.height,
        },
        rects,
      };
    });

    const W = measurements.viewportWidth; // 1024
    const H = measurements.viewportHeight; // 768
    const OFFSET = 16; // default 1rem (16px)

    // The anchor itself spans the full viewport
    assert.deepEqual(measurements.anchorRect, { x: 0, y: 0, width: W, height: H });

    // Default "viewport" matches "viewport top right"
    assert.equal(measurements.rects['viewport'].top, OFFSET);
    assert.equal(measurements.rects['viewport'].rightGap, OFFSET);

    // 1. Top row (top = 16px)
    assert.equal(measurements.rects['viewport top left'].top, OFFSET);
    assert.equal(measurements.rects['viewport top left'].left, OFFSET);

    assert.equal(measurements.rects['viewport top center'].top, OFFSET);
    assert.ok(Math.abs(measurements.rects['viewport top center'].centerX - W / 2) <= 2);

    assert.equal(measurements.rects['viewport top right'].top, OFFSET);
    assert.equal(measurements.rects['viewport top right'].rightGap, OFFSET);

    // 2. Center row (centerY = 384px)
    assert.ok(Math.abs(measurements.rects['viewport center left'].centerY - H / 2) <= 2);
    assert.equal(measurements.rects['viewport center left'].left, OFFSET);

    assert.ok(Math.abs(measurements.rects['viewport center center'].centerY - H / 2) <= 2);
    assert.ok(Math.abs(measurements.rects['viewport center center'].centerX - W / 2) <= 2);

    assert.ok(Math.abs(measurements.rects['viewport center right'].centerY - H / 2) <= 2);
    assert.equal(measurements.rects['viewport center right'].rightGap, OFFSET);

    // 3. Bottom row (bottomGap = 16px)
    assert.equal(measurements.rects['viewport bottom left'].bottomGap, OFFSET);
    assert.equal(measurements.rects['viewport bottom left'].left, OFFSET);

    assert.equal(measurements.rects['viewport bottom center'].bottomGap, OFFSET);
    assert.ok(Math.abs(measurements.rects['viewport bottom center'].centerX - W / 2) <= 2);

    assert.equal(measurements.rects['viewport bottom right'].bottomGap, OFFSET);
    assert.equal(measurements.rects['viewport bottom right'].rightGap, OFFSET);
  });

  it('promotes ::part(container) to the Top Layer via Popover API in pointer mode, sets pointer coordinates on the <show-keystrokes> host, and positions ::part(anchor) at the mouse position', async () => {
    const client = await page.createCDPSession();
    await client.send('DOM.enable');
    await client.send('DOM.getDocument', { depth: -1, pierce: true });
    const beforeTopLayer = await client.send('DOM.getTopLayerElements');

    // Create the pointer-mode element and full-viewport z-index: 2147483647 blocker
    await page.evaluate(() => {
      const maxZBlocker = document.createElement('div');
      maxZBlocker.id = 'pointer-max-z-blocker';
      maxZBlocker.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; background: rgba(0, 0, 0, 0.5);';
      document.body.appendChild(maxZBlocker);

      const el = document.createElement('show-keystrokes');
      el.id = 'pointer-top-layer-test-el';
      el.setAttribute('position', 'pointer bottom right');
      el.setAttribute('hide-delay', '0');
      el.style.setProperty('--show-keystrokes-pointer-events', 'auto');
      document.body.appendChild(el);
    });

    // Move the real browser mouse to (320, 240)
    await page.mouse.move(320, 240);

    const pointerData = await page.evaluate(() => {
      const el = document.getElementById('pointer-top-layer-test-el');
      el.showKeys('CMD + P');

      const anchor = el.shadowRoot.querySelector('[part="anchor"]');
      const container = el.shadowRoot.querySelector('[part="container"]');
      const anchorCS = getComputedStyle(anchor);
      const anchorTop = anchorCS.top;
      const anchorLeft = anchorCS.left;
      const anchorTranslate = anchorCS.translate;
      const anchorRect = anchor.getBoundingClientRect();
      const bottomRightRect = container.getBoundingClientRect();

      const centerX = bottomRightRect.left + bottomRightRect.width / 2;
      const centerY = bottomRightRect.top + bottomRightRect.height / 2;
      const lightDomHit = document.elementFromPoint(centerX, centerY);
      const shadowDomHit = el.shadowRoot.elementFromPoint(centerX, centerY);

      // Also check top-left relative to the anchor at (320, 240)
      el.setAttribute('position', 'pointer top left');
      const topLeftRect = container.getBoundingClientRect();

      const hostPointerX = el.style.getPropertyValue('--show-keystrokes-pointer-x');
      const hostPointerY = el.style.getPropertyValue('--show-keystrokes-pointer-y');
      const htmlPointerX = document.documentElement.style.getPropertyValue('--show-keystrokes-pointer-x');
      const htmlPointerY = document.documentElement.style.getPropertyValue('--show-keystrokes-pointer-y');
      const supportsNamedFeature = CSS.supports('named-feature(anchor-position-follows-transforms)');

      return {
        isPopoverOpen: container.matches(':popover-open'),
        lightDomHitId: lightDomHit?.id,
        shadowDomInsideContainer: container.contains(shadowDomHit),
        hostPointerX,
        hostPointerY,
        htmlPointerX,
        htmlPointerY,
        supportsNamedFeature,
        anchorTop,
        anchorLeft,
        anchorTranslate,
        anchorRect: {
          left: Math.round(anchorRect.left),
          top: Math.round(anchorRect.top),
          width: Math.round(anchorRect.width),
          height: Math.round(anchorRect.height),
          centerX: Math.round(anchorRect.left + anchorRect.width / 2),
          centerY: Math.round(anchorRect.top + anchorRect.height / 2),
        },
        bottomRightContainer: {
          left: Math.round(bottomRightRect.left),
          top: Math.round(bottomRightRect.top),
        },
        topLeftContainer: {
          right: Math.round(topLeftRect.right),
          bottom: Math.round(topLeftRect.bottom),
        },
      };
    });

    // Verify Top Layer presence via CDP DOM.getTopLayerElements
    await client.send('DOM.getDocument', { depth: -1, pierce: true });
    const afterTopLayer = await client.send('DOM.getTopLayerElements');
    const topLayerNodes = await Promise.all(
      afterTopLayer.nodeIds.map((nodeId) => client.send('DOM.describeNode', { nodeId }))
    );

    await page.evaluate(() => {
      document.getElementById('pointer-top-layer-test-el')?.remove();
      document.getElementById('pointer-max-z-blocker')?.remove();
    });
    await client.detach();

    assert.equal(pointerData.isPopoverOpen, true);
    assert.equal(pointerData.lightDomHitId, 'pointer-top-layer-test-el');
    assert.equal(pointerData.shadowDomInsideContainer, true);
    assert.ok(
      afterTopLayer.nodeIds.length > beforeTopLayer.nodeIds.length,
      'Expected CDP DOM.getTopLayerElements to include the active pointer-mode <show-keystrokes> popover'
    );
    const hasContainerInTopLayer = topLayerNodes.some(({ node }) => {
      const attrs = node.attributes || [];
      const partIdx = attrs.indexOf('part');
      const popoverIdx = attrs.indexOf('popover');
      return (
        node.localName === 'div' &&
        partIdx !== -1 &&
        attrs[partIdx + 1] === 'container' &&
        popoverIdx !== -1 &&
        attrs[popoverIdx + 1] === 'manual'
      );
    });
    assert.equal(hasContainerInTopLayer, true);

    // Verify pointer coordinates are on the <show-keystrokes> host element (not <html>)
    assert.equal(pointerData.hostPointerX, '320px');
    assert.equal(pointerData.hostPointerY, '240px');
    assert.equal(pointerData.htmlPointerX, '');
    assert.equal(pointerData.htmlPointerY, '');

    // Verify ::part(anchor) CSS properties according to @supports named-feature(anchor-position-follows-transforms)
    if (pointerData.supportsNamedFeature) {
      assert.equal(pointerData.anchorTop, '0px');
      assert.equal(pointerData.anchorLeft, '0px');
    } else {
      assert.equal(pointerData.anchorTop, '240px');
      assert.equal(pointerData.anchorLeft, '320px');
      assert.equal(pointerData.anchorTranslate, '-50% -50%');
    }

    // Verify ::part(anchor) is centered at (320, 240) with 20x20 (1.25rem) size
    assert.deepEqual(pointerData.anchorRect, {
      left: 310,
      top: 230,
      width: 20,
      height: 20,
      centerX: 320,
      centerY: 240,
    });

    // Verify ::part(container) anchors to the bottom-right and top-left of ::part(anchor)
    assert.ok(pointerData.bottomRightContainer.left >= 330);
    assert.ok(pointerData.bottomRightContainer.top >= 250);
    assert.ok(pointerData.topLeftContainer.right <= 310);
    assert.ok(pointerData.topLeftContainer.bottom <= 230);
  });

  it('filters live keyboard events according to [keystrokes] and dispatches the keystroke CustomEvent', async () => {
    const results = await page.evaluate(() => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('platform', 'mac');
      el.setAttribute('position', 'normal');
      el.setAttribute('hide-delay', '0');
      document.body.appendChild(el);

      const events = [];
      el.addEventListener('keystroke', (e) => {
        events.push({
          label: e.detail.label,
          category: e.detail.category,
          keys: e.detail.keys,
        });
      });

      const fireKey = (init) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
      };

      // 1. Default mode (shortcuts + navigational): ignores plain 'a', captures ArrowRight and CMD+A
      fireKey({ key: 'a', code: 'KeyA' });
      const afterPlainInDefault = el.keys;

      fireKey({ key: 'ArrowRight', code: 'ArrowRight' });
      const afterArrowInDefault = el.keys;

      fireKey({ key: 'a', code: 'KeyA', metaKey: true });
      const afterCmdAInDefault = el.keys;

      // 2. keystrokes="all": captures plain 'z'
      el.setAttribute('keystrokes', 'all');
      fireKey({ key: 'z', code: 'KeyZ' });
      const afterPlainInAll = el.keys;

      // 3. keystrokes="shortcuts": ignores ArrowUp
      el.clear();
      el.setAttribute('keystrokes', 'shortcuts');
      fireKey({ key: 'ArrowUp', code: 'ArrowUp' });
      const afterArrowInShortcuts = el.keys;

      el.remove();
      return {
        afterPlainInDefault,
        afterArrowInDefault,
        afterCmdAInDefault,
        afterPlainInAll,
        afterArrowInShortcuts,
        events,
      };
    });

    assert.equal(results.afterPlainInDefault, '');
    assert.equal(results.afterArrowInDefault, '→');
    assert.equal(results.afterCmdAInDefault, '⌘ + A');
    assert.equal(results.afterPlainInAll, 'Z');
    assert.equal(results.afterArrowInShortcuts, '');
    assert.equal(results.events.length, 3);
    assert.deepEqual(results.events[0], { label: '→', category: 'navigational', keys: ['→'] });
    assert.deepEqual(results.events[1], { label: '⌘ + A', category: 'shortcut', keys: ['⌘', 'A'] });
    assert.deepEqual(results.events[2], { label: 'Z', category: 'keystroke', keys: ['Z'] });
  });

  it('gives --show-keystrokes-hide-duration CSS custom property precedence over the hide-duration attribute', async () => {
    const durations = await page.evaluate(() => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('position', 'normal');
      document.body.appendChild(el);
      const container = el.shadowRoot.querySelector('[part="container"]');

      const defaultTransition = getComputedStyle(container).transitionDuration;

      el.setAttribute('hide-duration', '450');
      const attrTransition = getComputedStyle(container).transitionDuration;

      el.style.setProperty('--show-keystrokes-hide-duration', '800ms');
      const cssVarPrecedenceTransition = getComputedStyle(container).transitionDuration;

      el.style.removeProperty('--show-keystrokes-hide-duration');
      const fallbackToAttrTransition = getComputedStyle(container).transitionDuration;

      el.remove();
      return {
        defaultTransition,
        attrTransition,
        cssVarPrecedenceTransition,
        fallbackToAttrTransition,
      };
    });

    assert.ok(durations.defaultTransition.startsWith('0.2s'));
    assert.ok(durations.attrTransition.startsWith('0.45s'));
    assert.ok(durations.cssVarPrecedenceTransition.startsWith('0.8s'));
    assert.ok(durations.fallbackToAttrTransition.startsWith('0.45s'));
  });

  it('supports programmatic creation via create(options, parentElement)', async () => {
    const created = await page.evaluate(async () => {
      const { create } = await import('/js/show-keystrokes/index.js');
      const host = document.createElement('div');
      document.body.appendChild(host);

      const el = create(
        {
          keystrokes: 'shortcuts',
          theme: 'mechanical',
          colorScheme: 'dark',
          size: 'x-large',
          position: 'viewport bottom left',
          notation: 'text',
          hideDelay: 1800,
          hideDuration: 350,
          platform: 'windows',
        },
        host
      );

      const state = {
        inHost: host.contains(el),
        theme: el.getAttribute('theme'),
        colorScheme: el.getAttribute('color-scheme'),
        size: el.getAttribute('size'),
        position: el.getAttribute('position'),
        notation: el.getAttribute('notation'),
        hideDelay: el.hideDelay,
        hideDuration: el.hideDuration,
        platform: el.platform,
      };

      host.remove();
      return state;
    });

    assert.equal(created.inHost, true);
    assert.equal(created.theme, 'mechanical');
    assert.equal(created.colorScheme, 'dark');
    assert.equal(created.size, 'x-large');
    assert.equal(created.position, 'viewport bottom left');
    assert.equal(created.notation, 'text');
    assert.equal(created.hideDelay, 1800);
    assert.equal(created.hideDuration, 350);
    assert.equal(created.platform, 'windows');
  });

  it('allows external CSS styling via ::part(anchor), ::part(container), ::part(key), ::part(modifier), ::part(primary), and ::part(separator)', async () => {
    const styled = await page.evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        #part-test-el::part(anchor) { outline: 2px dashed rgb(13, 148, 136); }
        #part-test-el::part(container) { background-color: rgb(30, 41, 59); }
        #part-test-el::part(key) { border-radius: 14px; }
        #part-test-el::part(modifier) { color: rgb(219, 39, 119); }
        #part-test-el::part(primary) { color: rgb(2, 132, 199); }
        #part-test-el::part(separator) { color: rgb(217, 119, 6); }
      `;
      document.head.appendChild(style);

      const el = document.createElement('show-keystrokes');
      el.id = 'part-test-el';
      el.setAttribute('static', '');
      el.setAttribute('keys', 'CMD + K');
      document.body.appendChild(el);

      const anchor = el.shadowRoot.querySelector('[part="anchor"]');
      const container = el.shadowRoot.querySelector('[part="container"]');
      const modifier = el.shadowRoot.querySelector('[part~="modifier"]');
      const primary = el.shadowRoot.querySelector('[part~="primary"]');
      const separator = el.shadowRoot.querySelector('[part="separator"]');

      const computed = {
        anchorOutlineColor: getComputedStyle(anchor).outlineColor,
        containerBg: getComputedStyle(container).backgroundColor,
        keyRadius: getComputedStyle(primary).borderRadius,
        modifierColor: getComputedStyle(modifier).color,
        primaryColor: getComputedStyle(primary).color,
        separatorColor: getComputedStyle(separator).color,
      };

      el.remove();
      style.remove();
      return computed;
    });

    assert.equal(styled.anchorOutlineColor, 'rgb(13, 148, 136)');
    assert.equal(styled.containerBg, 'rgb(30, 41, 59)');
    assert.equal(styled.keyRadius, '14px');
    assert.equal(styled.modifierColor, 'rgb(219, 39, 119)');
    assert.equal(styled.primaryColor, 'rgb(2, 132, 199)');
    assert.equal(styled.separatorColor, 'rgb(217, 119, 6)');
  });

  it('auto-hides and closes the top-layer popover after hide-delay and hide-duration elapse', async () => {
    const lifecycle = await page.evaluate(async () => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('position', 'viewport top right');
      el.setAttribute('hide-delay', '60');
      el.setAttribute('hide-duration', '40');
      document.body.appendChild(el);

      const container = el.shadowRoot.querySelector('[part="container"]');
      el.showKeys('CMD + S');
      const immediatelyOpen = container.matches(':popover-open') && el.hasAttribute('active');

      await new Promise((r) => setTimeout(r, 180));
      const afterTimeoutOpen = container.matches(':popover-open');
      const afterTimeoutActive = el.hasAttribute('active');

      el.remove();
      return { immediatelyOpen, afterTimeoutOpen, afterTimeoutActive };
    });

    assert.equal(lifecycle.immediatelyOpen, true);
    assert.equal(lifecycle.afterTimeoutOpen, false);
    assert.equal(lifecycle.afterTimeoutActive, false);
  });

  it('ignores <input type="password"> by default, ignores all editable elements (<input>, <textarea>, [contenteditable]) when ignore="editable" while keeping checkboxes active, and ignores nothing when ignore="none"', async () => {
    const ignoreResult = await page.evaluate(() => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('keystrokes', 'all');
      el.setAttribute('platform', 'mac');
      document.body.appendChild(el);

      const pwdInput = document.createElement('input');
      pwdInput.type = 'password';
      const textInput = document.createElement('input');
      textInput.type = 'text';
      const textarea = document.createElement('textarea');
      const ceDiv = document.createElement('div');
      ceDiv.setAttribute('contenteditable', 'true');
      ceDiv.tabIndex = 0;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';

      document.body.append(pwdInput, textInput, textarea, ceDiv, checkbox);

      // 1. Default (ignore not set -> ignores sensitive): password input blocked, text input allowed
      pwdInput.focus();
      pwdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', bubbles: true }));
      const labelAfterPwdDefault = el.keys;

      pwdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true }));
      const labelAfterPwdNavDefault = el.keys;

      pwdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', metaKey: true, bubbles: true }));
      const labelAfterPwdShortcutDefault = el.keys;

      textInput.focus();
      textInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', bubbles: true }));
      const labelAfterTextDefault = el.keys;

      // 2. Set el.ignore = 'editable': clears active keystroke on focused textInput, blocks text/textarea/contenteditable/password, allows checkbox
      el.ignore = 'editable';
      const reflectedEditableAttr = el.getAttribute('ignore');
      const labelAfterIgnoreEditableSetWhileTextFocused = el.keys;

      textInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', bubbles: true }));
      const labelAfterTextWhenEditableIgnored = el.keys;

      textarea.focus();
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', code: 'KeyN', bubbles: true }));
      const labelAfterTextareaWhenEditableIgnored = el.keys;

      ceDiv.focus();
      ceDiv.dispatchEvent(new KeyboardEvent('keydown', { key: 'o', code: 'KeyO', bubbles: true }));
      const labelAfterCeWhenEditableIgnored = el.keys;

      checkbox.focus();
      checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
      const labelAfterCheckboxWhenEditableIgnored = el.keys;

      // 3. Set el.ignore = 'none': keystrokes are displayed even when password input is focused
      pwdInput.focus();
      el.ignore = 'none';
      const reflectedNoneAttr = el.getAttribute('ignore');

      pwdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', code: 'KeyX', bubbles: true }));
      const labelAfterPwdWhenNoneIgnored = el.keys;

      pwdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', metaKey: true, bubbles: true }));
      const labelAfterPwdShortcutWhenNoneIgnored = el.keys;

      // 4. Resetting ignore to default ('') while password input is still focused clears any currently displayed keystroke
      el.ignore = '';
      const labelAfterIgnoreResetWhilePwdFocused = el.keys;

      pwdInput.remove();
      textInput.remove();
      textarea.remove();
      ceDiv.remove();
      checkbox.remove();
      el.remove();

      return {
        labelAfterPwdDefault,
        labelAfterPwdNavDefault,
        labelAfterPwdShortcutDefault,
        labelAfterTextDefault,
        reflectedEditableAttr,
        labelAfterIgnoreEditableSetWhileTextFocused,
        labelAfterTextWhenEditableIgnored,
        labelAfterTextareaWhenEditableIgnored,
        labelAfterCeWhenEditableIgnored,
        labelAfterCheckboxWhenEditableIgnored,
        reflectedNoneAttr,
        labelAfterPwdWhenNoneIgnored,
        labelAfterPwdShortcutWhenNoneIgnored,
        labelAfterIgnoreResetWhilePwdFocused,
      };
    });

    assert.equal(ignoreResult.labelAfterPwdDefault, '');
    assert.equal(ignoreResult.labelAfterPwdNavDefault, '');
    assert.equal(ignoreResult.labelAfterPwdShortcutDefault, '');
    assert.equal(ignoreResult.labelAfterTextDefault, 'M');
    assert.equal(ignoreResult.reflectedEditableAttr, 'editable');
    assert.equal(ignoreResult.labelAfterIgnoreEditableSetWhileTextFocused, '');
    assert.equal(ignoreResult.labelAfterTextWhenEditableIgnored, '');
    assert.equal(ignoreResult.labelAfterTextareaWhenEditableIgnored, '');
    assert.equal(ignoreResult.labelAfterCeWhenEditableIgnored, '');
    assert.equal(ignoreResult.labelAfterCheckboxWhenEditableIgnored, 'SPACE');
    assert.equal(ignoreResult.reflectedNoneAttr, 'none');
    assert.equal(ignoreResult.labelAfterPwdWhenNoneIgnored, 'X');
    assert.equal(ignoreResult.labelAfterPwdShortcutWhenNoneIgnored, '⌘ + A');
    assert.equal(ignoreResult.labelAfterIgnoreResetWhilePwdFocused, '');
  });

  it('does not reset the auto-hide timeout when typing into an ignored password input after pressing TAB', async () => {
    const result = await page.evaluate(async () => {
      const el = document.createElement('show-keystrokes');
      el.setAttribute('platform', 'mac');
      el.setAttribute('hide-delay', '80');
      el.setAttribute('hide-duration', '30');
      document.body.appendChild(el);

      const textInput = document.createElement('input');
      textInput.type = 'text';
      const pwdInput = document.createElement('input');
      pwdInput.type = 'password';
      document.body.append(textInput, pwdInput);

      // 1. Focus text input and press TAB to move to password input
      textInput.focus();
      textInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true }));
      pwdInput.focus();
      pwdInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', bubbles: true }));

      const labelAfterTab = el.keys;

      // 2. Repeatedly type into the password input every 30ms (which previously reset #fadeTimer on keyup)
      for (let i = 0; i < 4; i++) {
        await new Promise((r) => setTimeout(r, 35));
        pwdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', bubbles: true }));
        pwdInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', bubbles: true }));
      }

      const labelAfterTypingInPassword = el.keys;
      const isActiveAfterTypingInPassword = el.hasAttribute('active');

      textInput.remove();
      pwdInput.remove();
      el.remove();

      return {
        labelAfterTab,
        labelAfterTypingInPassword,
        isActiveAfterTypingInPassword,
      };
    });

    assert.equal(result.labelAfterTab, '⇥');
    assert.equal(result.labelAfterTypingInPassword, '');
    assert.equal(result.isActiveAfterTypingInPassword, false);
  });
});

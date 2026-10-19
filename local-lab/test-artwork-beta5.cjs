const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const {chromium} = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:18765';
const server = spawn('python3', ['local-lab/server.py'], {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
(async () => {
  await new Promise((resolve, reject) => {
    server.stdout.once('data', resolve);
    server.once('error', reject);
    server.once('exit', code => reject(Error('server ' + code)));
  });
  const browser = await chromium.launch({headless: true, executablePath: process.env.RTV_CHROMIUM || '/root/.cache/ms-playwright/chromium_headless_shell-1161/chrome-linux/headless_shell', args: ['--no-sandbox']});
  try {
    const context = await browser.newContext({viewport: {width: 1280, height: 720}});
    const images = [], errors = [];
    let inFlight = 0, maximum = 0;
    async function bridge(route, direct) {
      const url = route.request().url();
      const cover = /\/Images\/Primary/.test(url);
      if (cover) {
        inFlight++;
        maximum = Math.max(maximum, inFlight);
        images.push({at: Date.now(), url});
      }
      try {
        const target = direct ? base + '/fetch?u=' + encodeURIComponent(url) : url.replace('http://127.0.0.1:8765', base);
        const response = await context.request.get(target);
        await route.fulfill({response, headers: {...response.headers(), 'access-control-allow-origin': '*'}});
      } catch (error) {
        await route.abort().catch(() => {});
      } finally {
        if (cover) inFlight--;
      }
    }
    await context.route('http://127.0.0.1:8765/**', route => bridge(route, false));
    await context.route('http://tv.fixture/**', route => bridge(route, true));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => TVLab.ready === 'player1');
    await page.locator('#rawLaunch').click();
    await page.waitForSelector('.ch14');
    await page.locator('#hm14').click();
    await page.locator('.cat14').first().click();
    await page.waitForSelector('.card14');
    await page.waitForFunction(() => [...document.querySelectorAll('.card14 img')].every(x => x.style.visibility === 'visible'));
    const posters = await page.locator('.card14').evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      return {x: box.x, y: box.y, width: box.width, height: box.height, title: card.getAttribute('aria-label')};
    }));
    assert.equal(posters.length, 10);
    assert.ok(posters.every(x => x.width === 170 && x.height === 238));
    assert.equal(new Set(posters.map(x => x.y)).size, 2);
    assert.equal(new Set(posters.slice(0, 5).map(x => x.y)).size, 1);
    assert.ok(posters.every(x => x.x + x.width <= 1280));
    const sidebar = await page.locator('.catcol14').boundingBox();
    assert.ok(posters[0].x >= sidebar.x + sidebar.width + 20);
    const footer = await page.locator('.content14 .foot14').boundingBox();
    assert.ok(footer.y + footer.height <= 720, 'poster page footer must remain visible');
    assert.ok(images.length >= 10);
    assert.ok(images[2].at - images[0].at < 150, 'first three covers must start together');
    assert.ok(maximum <= 3 && maximum >= 2, 'VOD covers must respect a three-slot budget');
    await page.locator('.card14').first().focus();
    const focus = await page.locator('.card14').first().evaluate(card => ({color: getComputedStyle(card).borderTopColor, width: getComputedStyle(card).borderTopWidth, radius: getComputedStyle(card).borderTopLeftRadius}));
    assert.deepEqual(focus, {color: 'rgb(255, 255, 255)', width: '1px', radius: '4px'});
    assert.equal(await page.locator('.fade14,.name14').count(), 0);
    await page.screenshot({path: path.join(__dirname, 'results/posters-beta5.png')});
    const opened = Date.now();
    await page.locator('.card14').first().click();
    await page.waitForSelector('#play14');
    const detailReadyMs = Date.now() - opened;
    assert.ok(detailReadyMs < 2000);
    await page.locator('#play14').focus();
    await page.waitForSelector('.movieInfo19 .movieLogo19');
    assert.equal(await page.locator('.movieInfo19 h1').count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'play14');
    await page.screenshot({path: path.join(__dirname, 'results/movie-logo-beta5.png')});
    await page.locator('#db14').click();
    await page.locator('#hs14').click();
    await page.locator('.cat14').first().click();
    await page.waitForSelector('.card14');
    await page.locator('.card14').first().click();
    await page.waitForSelector('.ep14');
    await page.waitForFunction(() => [...document.querySelectorAll('.ep14 img')].every(x => x.style.visibility === 'visible'));
    await page.locator('.ep14').first().focus();
    const episodes = await page.locator('.ep14').evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect(), style = getComputedStyle(card);
      return {x: box.x, y: box.y, width: box.width, height: box.height, border: style.borderTopColor, borderWidth: style.borderTopWidth};
    }));
    assert.equal(episodes.length, 6);
    assert.equal(new Set(episodes.map(x => x.y)).size, 2);
    assert.equal(episodes[0].border, 'rgb(255, 255, 255)');
    assert.ok(episodes.every(x => x.borderWidth === '1px'));
    assert.equal(await page.locator('.epflare14,.eplabel14').count(), 0);
    assert.ok(episodes.every(x => x.x + x.width <= 1280 && x.y + x.height <= 720));
    await page.waitForSelector('.seriesLeft19 .movieLogo19');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'ep14 glass14');
    await page.screenshot({path: path.join(__dirname, 'results/episodes-beta5.png')});
    assert.deepEqual(errors, []);
    const result = {status: 'PASS', version: '0.56-beta.5', viewport: '1280x720', posters, focus, sidebar, detailReadyMs, maximumParallelCovers: maximum, episodes, pageErrors: errors, limits: ['Synthetic provider artwork/logo and catalog', 'Chromium, not the Philco GPU/WebKit or real TMDB']};
    fs.writeFileSync(path.join(__dirname, 'results/artwork-beta5.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.kill());

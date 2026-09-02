/**
 * scripts/capture-recap.js
 * ------------------------
 * One-off dev script (devDependency: playwright) that captures a REAL
 * demo of the "Generate my recap" feature from the LIVE site and turns
 * it into embeddable / shareable assets.
 *
 * What it does:
 *   1. Launches headless Chromium (Playwright).
 *   2. Navigates to the live site: https://madb0i.github.io/gracias-messi/
 *   3. Clicks "Generate my recap" and waits for the in-page MediaRecorder
 *      to finish and auto-download the .webm (the existing flow — the
 *      recap draws a 1080x1920 canvas for ~15s, records it with
 *      canvas.captureStream() + MediaRecorder, then triggers a download).
 *   4. Converts that .webm with ffmpeg into:
 *        - assets/recap-demo.mp4  (H.264, for README / Twitter, < 15MB)
 *        - assets/recap-demo.gif  (2-pass palette, looped, for README top)
 *
 * This is a REAL capture of the running site, not a mockup.
 *
 * Fallback: if Playwright can't catch the blob download, we fall back to
 * Playwright's own tab video (page.video) recorded while the recap plays.
 * (The recap draws to an offscreen canvas, so the tab video mainly shows
 * the progress UI; the download path is the primary + proven route and is
 * retried a few times before we fall back.)
 *
 * Run:  npm run capture:recap     (or: node scripts/capture-recap.js)
 *
 * The exact ffmpeg commands used, for reference / re-runs:
 *
 *   # .webm  -> .mp4  (H.264, yuv420p, +faststart so it streams in-browser,
 *   #           no audio track; ~0.5MB for a 15s 1080x1920 clip)
 *   ffmpeg -y -v error -i recap.webm \
 *     -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
 *     -movflags +faststart -an assets/recap-demo.mp4
 *
 *   # .webm  -> .gif  (15fps, scaled to 360x640 keeping 9:16, two-pass
 *   #           palette for a small, clean file, looped, bayer dither)
 *   ffmpeg -y -v error -i recap.webm \
 *     -vf "fps=15,scale=360:640:flags=lanczos,split[s0][s1];\
 * [s0]palettegen[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
 *     -loop 0 assets/recap-demo.gif
 */

const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SITE = 'https://madb0i.github.io/gracias-messi/';
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gm-recap-'));
const WEBM = path.join(TMP, 'recap.webm');
const MP4 = path.join(ASSETS, 'recap-demo.mp4');
const GIF = path.join(ASSETS, 'recap-demo.gif');
const ATTEMPTS = 3;

function ffmpeg(args) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...args], { stdio: 'inherit' });
}

function sizeMB(p) {
  return (fs.statSync(p).size / (1024 * 1024)).toFixed(2);
}

/** Try to drive the in-page recap and save the MediaRecorder .webm. */
async function captureWebm(browser) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const ctx = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      acceptDownloads: true,
      deviceScaleFactor: 1
    });
    const page = await ctx.newPage();
    try {
      await page.goto(SITE, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.getElementById('recapBtn').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(400);

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30000 }),
        page.click('#recapBtn')
      ]);
      await download.saveAs(WEBM);
      const head = fs.readFileSync(WEBM).slice(0, 2);
      if (!(head[0] === 0x1a && head[1] === 0x45)) throw new Error('captured file is not a WebM');
      console.log(`  [attempt ${attempt}] captured ${WEBM} (${sizeMB(WEBM)}MB)`);
      await ctx.close();
      return true;
    } catch (err) {
      console.log(`  [attempt ${attempt}] download capture failed: ${err.message.split('\n')[0]}`);
      await ctx.close().catch(() => {});
      // clear any partial file
      if (fs.existsSync(WEBM)) fs.unlinkSync(WEBM);
    }
  }
  return false;
}

/** Fallback: record the tab itself while the recap plays (page.video). */
async function captureTabVideo(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    recordVideo: { dir: TMP, size: { width: 1080, height: 1920 } }
  });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getElementById('recapBtn').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(400);
  await page.click('#recapBtn');
  console.log('  recording tab for ~17s…');
  await page.waitForTimeout(17000);
  const video = await page.video();
  const remote = await video.path();
  fs.copyFileSync(remote, WEBM);
  await ctx.close();
  console.log(`  [fallback] recorded tab video (${sizeMB(WEBM)}MB)`);
  return fs.existsSync(WEBM);
}

(async () => {
  fs.mkdirSync(ASSETS, { recursive: true });
  console.log(`→ capturing from ${SITE}`);
  const browser = await chromium.launch();
  let got = await captureWebm(browser);
  if (!got) {
    console.log('→ falling back to tab video');
    got = await captureTabVideo(browser);
  }
  await browser.close();

  if (!got || !fs.existsSync(WEBM)) {
    console.error('✗ could not capture the recap video');
    process.exit(1);
  }

  console.log('→ converting to MP4 + GIF with ffmpeg');
  // .webm -> .mp4 (H.264, faststart, no audio)
  ffmpeg(['-i', WEBM, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', MP4]);
  // .webm -> .gif (15fps, 360x640, 2-pass palette, looped)
  ffmpeg(['-i', WEBM, '-vf',
    'fps=15,scale=360:640:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5',
    '-loop', '0', GIF]);

  console.log('\n✓ done:');
  console.log(`   ${path.relative(ROOT, MP4)}  (${sizeMB(MP4)}MB)`);
  console.log(`   ${path.relative(ROOT, GIF)}  (${sizeMB(GIF)}MB)`);
  // clean up temp
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch(e => { console.error('FATAL', e); process.exit(1); });

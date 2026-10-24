// OGP画像（public/og.png, 1200x630）を作る。
// 1) 人の絵のSVG（アプリと同じポーズ）を scripts/og/figures.json に置く
// 2) node scripts/og/build-og.mjs で og.html を作り、Playwright（Chromium）で撮影する
//    例：npx -y -p playwright node scripts/og/build-og.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const figs = JSON.parse(readFileSync(join(here, 'figures.json'), 'utf8'));
const strip = (svg) => svg.replace(/<svg[^>]*>/, '').replace('</svg>', '');

const days = [
  { d: 'M', s: 'done' }, { d: 'T', s: '' }, { d: 'W', s: '' }, { d: 'T', s: 'done' },
  { d: 'F', s: '' }, { d: 'S', s: 'next' }, { d: 'S', s: '' },
];
const check = '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#05140a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// 60秒のリング：49秒ぶん進んだ弧と、5秒ごとの目盛り
const R = 206, C = 2 * Math.PI * R, done = 49 / 60;
const ticks = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
  const r1 = i % 5 === 0 ? 236 : 240, r2 = 248;
  return `<line x1="${250 + r1 * Math.cos(a)}" y1="${250 + r1 * Math.sin(a)}" x2="${250 + r2 * Math.cos(a)}" y2="${250 + r2 * Math.sin(a)}" stroke="rgba(255,255,255,${i % 5 === 0 ? 0.35 : 0.12})" stroke-width="${i % 5 === 0 ? 3 : 2}" stroke-linecap="round"/>`;
}).join('');

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+JP:wght@900&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{position:relative;background:#090a09;color:#f4f6f4;font-family:Inter,'Noto Sans JP',sans-serif}
.bg{position:absolute;inset:0;background:
  radial-gradient(circle at 79% 50%,rgba(63,185,80,.26),rgba(63,185,80,0) 34%),
  radial-gradient(circle at 0% 100%,rgba(63,185,80,.10),rgba(63,185,80,0) 40%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:42px 42px;-webkit-mask-image:linear-gradient(90deg,#000 0%,rgba(0,0,0,.35) 55%,#000 100%)}
.left{position:absolute;left:76px;top:66px;width:640px}
.eyebrow{display:flex;align-items:center;gap:12px;font:700 19px 'JetBrains Mono',monospace;letter-spacing:.24em;color:#3fb950}
.eyebrow i{width:11px;height:11px;border-radius:50%;background:#3fb950;box-shadow:0 0 16px #3fb950}
h1{margin-top:20px;font:900 132px/1 'Noto Sans JP',sans-serif;letter-spacing:-.02em}
.en1{margin-top:30px;font:900 58px/1.05 Inter,sans-serif;letter-spacing:-.03em}
.en2{margin-top:10px;font:600 33px/1.2 Inter,sans-serif;color:#9da69e;letter-spacing:-.01em}
.en2 b{color:#f4f6f4;font-weight:800}
.week{position:absolute;left:76px;bottom:70px;display:flex;align-items:center;gap:12px}
.day{display:flex;flex-direction:column;align-items:center;gap:7px;font:700 13px 'JetBrains Mono',monospace;color:#6f776f}
.dot{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.07);display:grid;place-items:center}
.dot.done{background:#3fb950;box-shadow:0 0 22px rgba(63,185,80,.45)}
.dot.next{background:transparent;border:2.5px dashed #3fb950}
.goal{margin-left:14px;margin-bottom:20px;padding:9px 16px;border-radius:999px;border:1.5px solid rgba(63,185,80,.55);font:700 17px 'JetBrains Mono',monospace;color:#6fdc84;letter-spacing:.06em}
.ring{position:absolute;left:693px;top:80px;width:470px;height:470px}
.fig{position:absolute;left:760px;top:152px;width:360px}
.fig svg{width:100%;height:auto;overflow:visible}
.fig .fig-floor{stroke:rgba(255,255,255,.16);stroke-width:2}
.fig .fig-body path{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
.ghost1 .fig-body path{stroke:rgba(63,185,80,.14)} .ghost1 .fig-head{fill:rgba(63,185,80,.14)}
.ghost2 .fig-body path{stroke:rgba(63,185,80,.36)} .ghost2 .fig-head{fill:rgba(63,185,80,.36)}
.main .fig-body path{stroke:#f4f6f4} .main .fig-head{fill:#f4f6f4}
.ghost1 .fig-floor,.ghost2 .fig-floor{display:none}
.time{position:absolute;left:693px;width:470px;top:418px;text-align:center;font:700 44px 'JetBrains Mono',monospace;letter-spacing:.02em}
.time small{display:block;margin-top:4px;font:700 13px 'JetBrains Mono',monospace;letter-spacing:.3em;color:#6f776f}
.foot{position:absolute;right:56px;bottom:30px;font:500 15px 'JetBrains Mono',monospace;color:#5f675f;letter-spacing:.08em}
</style></head><body>
<div class="bg"></div><div class="grid"></div>
<div class="left">
  <p class="eyebrow"><i></i>1-MINUTE STRENGTH HABIT</p>
  <h1>1分筋トレ</h1>
  <p class="en1">Not every day.</p>
  <p class="en2"><b>2–3×</b> a week. <b>One minute</b> each.</p>
</div>
<div class="week">
  ${days.map((x) => `<div class="day"><span class="dot ${x.s}">${x.s === 'done' ? check : ''}</span>${x.d}</div>`).join('')}
  <span class="goal">2 / 2 WEEK ✓</span>
</div>
<svg class="ring" viewBox="0 0 500 500">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fdc84"/><stop offset="1" stop-color="#2ea043"/></linearGradient></defs>
  ${ticks}
  <circle cx="250" cy="250" r="${R}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="16"/>
  <circle cx="250" cy="250" r="${R}" fill="none" stroke="url(#g)" stroke-width="16" stroke-linecap="round"
    stroke-dasharray="${C * done} ${C}" transform="rotate(-90 250 250)" style="filter:drop-shadow(0 0 10px rgba(63,185,80,.55))"/>
</svg>
<div class="fig">
  <svg viewBox="0 0 200 140" style="position:absolute;inset:0" class="ghost1">${strip(figs['squat-0'])}</svg>
  <svg viewBox="0 0 200 140" style="position:absolute;inset:0" class="ghost2">${strip(figs['squat-0.5'])}</svg>
  <svg viewBox="0 0 200 140" class="main">${strip(figs['squat-1'])}</svg>
</div>
<p class="time">0:11<small>LEFT</small></p>
<p class="foot">NO SIGN-UP · DATA STAYS ON YOUR DEVICE</p>
</body></html>`;
writeFileSync(join(here, 'og.html'), html);

const out = process.argv[2] ?? join(here, '..', '..', 'public', 'og.png');
const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto('file://' + join(here, 'og.html'));
await page.evaluate(() => document.fonts.ready);
// 人の絵（床の線を除く）の中心を、リングの中心より少し上に合わせる
await page.evaluate(() => {
  const ring = document.querySelector('.ring').getBoundingClientRect();
  const cx = ring.left + ring.width / 2, cy = ring.top + ring.height / 2 - 34;
  const parts = [...document.querySelectorAll('.main .fig-body path, .main .fig-head')].map((e) => e.getBoundingClientRect());
  const l = Math.min(...parts.map((r) => r.left)), r = Math.max(...parts.map((r) => r.right));
  const t = Math.min(...parts.map((r) => r.top)), b = Math.max(...parts.map((r) => r.bottom));
  const fig = document.querySelector('.fig');
  fig.style.transform = `translate(${cx - (l + r) / 2}px, ${cy - (t + b) / 2}px)`;
});
await page.waitForTimeout(300);
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);

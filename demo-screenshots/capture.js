const puppeteer = require('puppeteer-core');
const path = require('path');

const PAGES = [
  { url: '/', name: '01-home' },
  { url: '/create', name: '02-create' },
  { url: '/dashboard', name: '03-dashboard' },
  { url: '/analytics', name: '04-analytics' },
  { url: '/pay/10', name: '05-payment' },
  { url: '/pos', name: '06-pos' },
  { url: '/staking', name: '07-staking' },
  { url: '/governance', name: '08-governance' },
  { url: '/rewards', name: '09-rewards' },
  { url: '/batch', name: '10-batch' },
  { url: '/settings', name: '11-settings' },
  { url: '/developers', name: '12-developers' },
  { url: '/faucet', name: '13-faucet' },
  { url: '/widget', name: '14-widget' },
];

const BASE = 'https://qie-pay.vercel.app';
const OUT = path.join(__dirname);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const p of PAGES) {
    const url = BASE + p.url;
    console.log(`📸 ${p.name} → ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000)); // wait for animations
      await page.screenshot({ path: path.join(OUT, `${p.name}.png`), fullPage: false });
    } catch (e) {
      console.log(`  ⚠️ ${e.message.slice(0, 80)}`);
    }
  }

  await browser.close();
  console.log('\n✅ Done! Screenshots saved.');
})();

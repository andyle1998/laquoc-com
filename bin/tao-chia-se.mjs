#!/usr/bin/env node
/* Tạo phần xem trước khi gửi link (Facebook, Zalo, Messenger, Telegram, X…).
 * Đọc dữ liệu bài viết + Lab từ index.html, rồi sinh:
 *   - og/<ten>.png        ảnh xem trước 1200×630 (chụp bằng Chrome headless)
 *   - <duong-dan>/index.html  trang chia sẻ: có thẻ og:*, người mở được chuyển về /#…
 *   - khối <!--og:start-->…<!--og:end--> trong <head> của index.html (trang chủ)
 *   - favicon.svg, apple-touch-icon.png
 * Chạy lại mỗi khi thêm/sửa bài hoặc sản phẩm:  node bin/tao-chia-se.mjs
 * Thêm --khong-anh để chỉ sinh trang, bỏ qua chụp ảnh. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIEN = 'https://laquoc.com';
const TEN_TRANG = 'Bác sĩ Chain';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const KHONG_ANH = process.argv.includes('--khong-anh');

const html = fs.readFileSync(path.join(GOC, 'index.html'), 'utf8');
const duLieu = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const { ARTICLES, APPS, ICONS } = new Function(duLieu + ';return {ARTICLES,APPS,ICONS}')();
const logoD = html.match(/id="logo-path"[^>]*\sd="([^"]+)"/)[1];

const tron = s => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cat = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

/* ---------- danh sách trang ---------- */
const trang = [
  { ten: 'trang-chu', duong: '', bam: '', nhan: 'Blockchain · AI · Công nghệ',
    tieuDe: 'Bác sĩ Chain · Hành AI hay bị AI hành...', icon: 'chain',
    tomTat: 'Khám, chẩn đoán và kê đơn cho những khái niệm công nghệ khó nuốt: blockchain, tài sản số, AI. Giải thích bằng ví dụ đời thường, kèm sản phẩm chạy thử trong Lab.' },
  { ten: 'bai-viet', duong: 'bai-viet/', bam: 'bai-viet', nhan: 'Bài viết', icon: 'term',
    tieuDe: 'Bệnh án công nghệ', tomTat: 'Các bài viết về blockchain, tài sản số và AI thực chiến, giải thích bằng ví dụ đời thường cho người không chuyên.' },
  { ten: 'lab', duong: 'lab/', bam: 'lab', nhan: 'Lab', icon: 'rocket',
    tieuDe: 'Lab sản phẩm', tomTat: 'Nơi các sản phẩm ấp ủ chạy thật ngay trên trình duyệt để bạn bè dùng thử và góp ý, trước khi thương mại hóa.' },
  { ten: 'bao-chi', duong: 'bao-chi/', bam: 'bao-chi', nhan: 'Báo chí', icon: 'quiz',
    tieuDe: 'Trên vài mặt báo', tomTat: 'Những buổi nói chuyện, lớp học và bài báo về blockchain, tài sản số và AI.' },
  { ten: 'gioi-thieu', duong: 'gioi-thieu/', bam: 'gioi-thieu', nhan: 'Giới thiệu', icon: 'bot',
    tieuDe: 'Xin chào, tôi là Quốc', tomTat: 'Học Y, rẽ sang blockchain từ 2018, giờ học lại từ đầu cùng AI. Trang này để chia sẻ một tầm nhìn và ấp ủ vài sản phẩm.' },
  ...ARTICLES.map(a => ({ ten: 'bai-' + a.id, duong: `bai/${a.id}/`, bam: 'bai-' + a.id,
    nhan: `${a.cat} · Bài ${a.n}`, tieuDe: tron(a.title), tomTat: tron(a.sub), icon: a.icon })),
  ...APPS.map(a => ({ ten: 'lab-' + a.id, duong: `lab/${a.id}/`, bam: 'lab-' + a.id,
    nhan: a.mode === 'web' ? 'Lab · Bản web' : 'Lab · Chạy trên trình duyệt', tieuDe: tron(a.title), tomTat: tron(a.desc), icon: a.icon })),
];

/* ---------- thẻ meta ---------- */
function theMeta(t) {
  const url = MIEN + '/' + t.duong;
  const tieu = t.ten === 'trang-chu' ? t.tieuDe : `${t.tieuDe} · ${TEN_TRANG}`;
  const tom = cat(t.tomTat, 200);
  const anh = `${MIEN}/og/${t.ten}.png`;
  return [
    `<title>${esc(tieu)}</title>`,
    `<meta name="description" content="${esc(tom)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="${t.ten.startsWith('bai-') && t.ten !== 'bai-viet' ? 'article' : 'website'}">`,
    `<meta property="og:site_name" content="${TEN_TRANG}">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(t.tieuDe)}">`,
    `<meta property="og:description" content="${esc(tom)}">`,
    `<meta property="og:image" content="${anh}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${esc(t.tieuDe)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(t.tieuDe)}">`,
    `<meta name="twitter:description" content="${esc(tom)}">`,
    `<meta name="twitter:image" content="${anh}">`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    `<meta name="theme-color" content="#E3E9EF">`,
  ].join('\n');
}

/* ---------- trang chia sẻ ---------- */
function trangChiaSe(t) {
  const den = '/#' + t.bam;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${theMeta(t)}
<script>location.replace(${JSON.stringify(den)})</script>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#E3E9EF;color:#122B35;font:16px system-ui,-apple-system,sans-serif}a{color:#007A6E}</style>
</head><body><p>Đang mở <a href="${den}">${esc(t.tieuDe)}</a>…</p></body></html>
`;
}

/* ---------- ảnh xem trước ---------- */
function mauAnh(t) {
  const tieu = t.tieuDe.length > 70 ? 54 : t.tieuDe.length > 44 ? 62 : 72;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&family=JetBrains+Mono:wght@600&display=swap">
<style>
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:#E3E9EF;color:#122B35;font-family:Montserrat,sans-serif;padding:56px 64px;display:grid;grid-template-columns:1fr 300px;gap:48px;position:relative}
body::after{content:"";position:absolute;left:0;right:0;bottom:0;height:12px;background:linear-gradient(90deg,#00A896,#FF7A33)}
.trai{display:flex;flex-direction:column;min-width:0}
.hieu{display:flex;align-items:center;gap:14px}
.hieu .mk{width:64px;height:64px;border-radius:18px;box-shadow:inset 4px 4px 9px #B2C0CC,inset -4px -4px 9px #fff;display:grid;place-items:center}
.hieu svg{width:46px;fill:#00A896}
.hieu b{font-size:28px;font-weight:900;letter-spacing:-.02em;display:block;line-height:1}
.hieu small{font-family:"JetBrains Mono",monospace;font-size:15px;letter-spacing:.14em;color:#007A6E;display:block;margin-top:6px}
.nhan{margin-top:44px;align-self:flex-start;font-family:"JetBrains Mono",monospace;font-size:19px;color:#007A6E;padding:8px 18px;border-radius:999px;box-shadow:inset 3px 3px 6px #B2C0CC,inset -3px -3px 6px #fff}
h1{margin-top:22px;font-size:${tieu}px;font-weight:900;letter-spacing:-.035em;line-height:1.08;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:-2px -2px 0 #fff,4px 5px 10px #B2C0CC}
p{margin-top:20px;font-size:24px;font-weight:500;color:#4C6270;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.mien{margin-top:auto;font-family:"JetBrains Mono",monospace;font-size:20px;color:#4C6270}
.mien b{color:#B5470C}
.phai{display:flex;align-items:center;justify-content:center}
.o{width:300px;height:300px;border-radius:72px;background:#E3E9EF;box-shadow:16px 16px 34px #B2C0CC,-16px -16px 34px #fff;display:grid;place-items:center}
.o svg{width:150px;height:150px;stroke:#00A896;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(4px 6px 4px rgba(0,90,82,.28))}
</style></head><body>
<div class="trai">
 <div class="hieu"><span class="mk"><svg viewBox="0 0 1242 942"><path fill-rule="evenodd" d="${logoD}"/></svg></span><span><b>Bác sĩ Chain</b><small>HÀNH AI</small></span></div>
 <span class="nhan">${esc(t.nhan)}</span>
 <h1>${esc(t.tieuDe)}</h1>
 <p>${esc(cat(t.tomTat, 150))}</p>
 <span class="mien"><b>laquoc.com</b>/${esc(t.duong)}</span>
</div>
<div class="phai"><span class="o">${t.ten === 'trang-chu' ? `<svg viewBox="0 0 1242 942" style="width:210px;height:auto;fill:#00A896;stroke:none"><path fill-rule="evenodd" d="${logoD}"/></svg>` : `<svg viewBox="0 0 24 24">${ICONS[t.icon] || ICONS.chain}</svg>`}</span></div>
</body></html>`;
}

function chup(nguon, dich, rong, cao) {
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
  const f = path.join(tam, 'mau.html');
  fs.writeFileSync(f, nguon);
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${tam}/c`,
    `--window-size=${rong},${cao}`, '--virtual-time-budget=4000', `--screenshot=${dich}`, 'file://' + f], { stdio: 'ignore' });
  fs.rmSync(tam, { recursive: true, force: true });
}

/* ---------- chạy ---------- */
fs.mkdirSync(path.join(GOC, 'og'), { recursive: true });
for (const t of trang) {
  if (t.duong) {
    const thuMuc = path.join(GOC, t.duong);
    fs.mkdirSync(thuMuc, { recursive: true });
    fs.writeFileSync(path.join(thuMuc, 'index.html'), trangChiaSe(t));
  }
  if (!KHONG_ANH) chup(mauAnh(t), path.join(GOC, 'og', t.ten + '.png'), 1200, 630);
}

const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -140 1322 1222"><rect x="-40" y="-140" width="1322" height="1222" rx="260" fill="#E3E9EF"/><path fill="#00A896" fill-rule="evenodd" d="${logoD}"/></svg>`;
fs.writeFileSync(path.join(GOC, 'favicon.svg'), svgLogo);
if (!KHONG_ANH) chup(`<!doctype html><style>*{margin:0}body{width:180px;height:180px;overflow:hidden}</style>${svgLogo.replace('<svg ', '<svg width="180" height="180" ')}`,
  path.join(GOC, 'apple-touch-icon.png'), 180, 180);

/* khối meta trang chủ trong index.html */
const khoi = `<!--og:start-->\n${theMeta(trang[0])}\n<!--og:end-->`;
let moi = html.replace(/<!--og:start-->[\s\S]*?<!--og:end-->/, khoi);
if (moi === html && !html.includes('<!--og:start-->')) moi = html.replace('</head>', khoi + '\n</head>');
fs.writeFileSync(path.join(GOC, 'index.html'), moi);

console.log(`Xong: ${trang.length} trang chia sẻ${KHONG_ANH ? '' : ' + ảnh xem trước'}.`);

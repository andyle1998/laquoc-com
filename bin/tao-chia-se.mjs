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
    anhHtml: '<h1 style="margin:auto 0 0">Bác sĩ Chain</h1><p class="slg"><i></i><span>Hành AI hay<br>bị AI hành...</span></p>',
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
<script>try{sessionStorage.setItem('bsc-ref',document.referrer)}catch(e){}location.replace(${JSON.stringify(den)})</script>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#E3E9EF;color:#122B35;font:16px system-ui,-apple-system,sans-serif}a{color:#007A6E}</style>
</head><body><p>Đang mở <a href="${den}">${esc(t.tieuDe)}</a>…</p></body></html>
`;
}

/* ---------- ảnh xem trước ---------- */
/* Bố cục: mọi thứ quan trọng nằm trong cột giữa 630px, nên khi nền tảng cắt ảnh
   thành ô vuông ở giữa (Slack, iMessage, Zalo thu nhỏ) vẫn thấy trọn logo + tiêu đề.
   Hai bên chỉ là trang trí. */
function mauAnh(t) {
  const n = t.tieuDe.length;
  const tieu = n > 64 ? 42 : n > 44 ? 48 : n > 26 ? 56 : 64;
  const hex = '0123456789abcdef';
  const cot = x => Array.from({ length: 9 }, (_, i) => `<span style="top:${i * 72 + 8}px;left:${x}px">${hex[(i * 7 + x) % 16]}${hex[(i * 3 + x * 5) % 16]}${hex[(i + x) % 16]}</span>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,500;0,700;0,900;1,700&family=JetBrains+Mono:wght@600&display=swap">
<style>
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{background:#E3E9EF;color:#122B35;font-family:Montserrat,sans-serif;position:relative}
body::after{content:"";position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#00A896,#FF7A33)}
.hx{position:absolute;inset:0;font-family:"JetBrains Mono",monospace;font-size:26px;color:#00A896;opacity:.16}
.hx span{position:absolute}
.ben{position:absolute;top:50%;transform:translateY(-50%);width:190px;height:190px;border-radius:48px;background:#E3E9EF;box-shadow:12px 12px 26px #B2C0CC,-12px -12px 26px #fff;display:grid;place-items:center}
.ben.t{left:60px}.ben.p{right:60px}
.ben svg{width:92px;height:92px;stroke:#00A896;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.ben.p b{font-family:"JetBrains Mono",monospace;font-size:20px;color:#007A6E;text-align:center;line-height:1.5}
.giua{position:absolute;left:285px;width:630px;top:0;bottom:10px;padding:46px 40px 40px;display:flex;flex-direction:column;align-items:center;text-align:center}
.lg{width:150px;height:150px;border-radius:50%;box-shadow:inset 6px 6px 14px #B2C0CC,inset -6px -6px 14px #fff;display:grid;place-items:center;flex:none}
.lg svg{width:108px;fill:#00A896;filter:drop-shadow(3px 5px 5px rgba(0,90,82,.3))}
.nhan{margin-top:22px;font-family:"JetBrains Mono",monospace;font-size:18px;color:#007A6E;padding:7px 16px;border-radius:999px;box-shadow:inset 3px 3px 6px #B2C0CC,inset -3px -3px 6px #fff}
h1{margin:auto 0;font-size:${tieu}px;font-weight:900;letter-spacing:-.03em;line-height:1.12;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;text-shadow:-2px -2px 0 #fff,4px 5px 10px #B2C0CC}
.mien{font-family:"JetBrains Mono",monospace;font-size:19px;color:#4C6270}
.slg{margin:14px 0 auto;display:inline-flex;align-items:center;gap:16px;padding:14px 28px 14px 22px;border-radius:999px;background:#E3E9EF;box-shadow:6px 6px 14px #B2C0CC,-6px -6px 14px #fff;font-size:36px;font-weight:700;font-style:italic;color:#007A6E;line-height:1.15;text-align:left;text-shadow:-1px -1px 0 #fff,2px 3px 6px rgba(0,90,82,.28)}
.slg i{flex:none;width:16px;height:16px;border-radius:50%;background:#FF7A33;box-shadow:0 0 0 6px rgba(255,122,51,.22)}
.mien b{color:#B5470C}
</style></head><body>
<div class="hx">${cot(24)}${cot(1118)}</div>
<span class="ben t"><svg viewBox="0 0 24 24">${ICONS[t.icon] || ICONS.chain}</svg></span>
<span class="ben p"><b>Bác sĩ<br>Chain<br>·<br>HÀNH AI</b></span>
<div class="giua">
 <span class="lg"><svg viewBox="0 0 1242 942"><path fill-rule="evenodd" d="${logoD}"/></svg></span>
 <span class="nhan">${esc(t.nhan)}</span>
 ${t.anhHtml || `<h1>${esc(t.tieuDe)}</h1>`}
 <span class="mien"><b>laquoc.com</b>${t.duong ? '/' + esc(t.duong.replace(/\/$/, '')) : ''}</span>
</div>
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

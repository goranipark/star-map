import { fitConstellationToBox, radiusForMagnitude } from './projection.js';
import { isUsableSketch } from './constellationSketch.js';

/**
 * 성좌 카드를 PNG 그림 파일로 저장한다 (ToDo.md Phase 4-B).
 *
 * 패들렛·클래스룸에 올리거나 인쇄해서 교실에 붙이려면 그림 파일이 필요하다.
 * 서버가 없으므로 브라우저에서 직접 그려 내려받는다.
 *
 * 화면의 카드를 그대로 캡처하는 대신 캔버스에 새로 그린다.
 * 캡처 방식은 브라우저마다 결과가 달라지고 글꼴이 깨지는 일이 잦은데,
 * 직접 그리면 어디서 눌러도 똑같은 그림이 나온다.
 */

const W = 1080;
const H = 1350; // 인쇄·게시에 무난한 4:5 세로 비율

const COLORS = {
  bg: '#0B0C1F',
  panel: '#1C2038',
  hairline: 'rgba(228, 231, 240, 0.22)',
  gold: '#E8C158',
  star: '#FFFDF4',
  text: '#E4E7F0',
  muted: 'rgba(228, 231, 240, 0.6)',
};

/** 사방으로 뻗는 십자 별빛. 화면의 별과 같은 모양으로 그린다. */
function drawGlint(ctx, x, y, radius, color) {
  const waist = radius * 0.13;

  ctx.save();
  ctx.translate(x, y);

  // 빛무리
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.2);
  halo.addColorStop(0, 'rgba(255, 253, 244, 0.85)');
  halo.addColorStop(0.3, 'rgba(245, 231, 184, 0.35)');
  halo.addColorStop(1, 'rgba(232, 193, 88, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // 십자 광채
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.quadraticCurveTo(waist, -waist, radius, 0);
  ctx.quadraticCurveTo(waist, waist, 0, radius);
  ctx.quadraticCurveTo(-waist, waist, -radius, 0);
  ctx.quadraticCurveTo(-waist, -waist, 0, -radius);
  ctx.fill();

  // 밝은 심지
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** 글이 상자 너비를 넘으면 줄을 나눈다. 한글은 글자 단위로 끊어도 자연스럽다. */
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    let line = '';
    for (const char of paragraph) {
      if (ctx.measureText(line + char).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 카드에 쓰는 글꼴. 둘 다 public/fonts/ 에 함께 배포한다. */
const DISPLAY_FONT = '"BMDoHyeon", "Baloo 2", sans-serif';
const BODY_FONT = '"Pretendard", system-ui, sans-serif';

/**
 * 성좌 카드를 캔버스에 그린다.
 * @param {object} constellation constellations.json의 별자리 한 칸과 같은 모양
 */
export function drawCard(canvas, constellation) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  const display = DISPLAY_FONT;
  const body = BODY_FONT;

  // ---------- 배경 ----------
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  const nebula = ctx.createRadialGradient(W / 2, H * 0.34, 0, W / 2, H * 0.34, W * 0.8);
  nebula.addColorStop(0, 'rgba(60, 50, 120, 0.38)');
  nebula.addColorStop(1, 'rgba(60, 50, 120, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, W, H);

  // ---------- 바깥 헤어라인 테두리 ----------
  const pad = 48;
  ctx.strokeStyle = COLORS.hairline;
  ctx.lineWidth = 2;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 28);
  ctx.stroke();

  // ---------- 자리 잡기 ----------
  // 권능이 길어지면 글이 아래로 밀려 표시와 겹친다.
  // 그래서 아래쪽(표시 → 만든 사람 → 권능) 순으로 자리를 먼저 잡고,
  // 남는 공간에 그림을 넣는다.
  const footerY = H - pad - 30;
  const authorY = footerY - 62;
  const powerLineH = 46;
  const powerBottom = (constellation.author ? authorY : footerY) - 46;

  // ---------- 별자리 그림 ----------
  const boxSize = W - pad * 2 - 240;
  const boxX = (W - boxSize) / 2;
  const boxY = pad + 88;

  ctx.fillStyle = 'rgba(11, 12, 31, 0.55)';
  ctx.strokeStyle = COLORS.hairline;
  roundRect(ctx, boxX, boxY, boxSize, boxSize, 20);
  ctx.fill();
  ctx.stroke();

  const { stars } = fitConstellationToBox(constellation, { size: boxSize, padding: boxSize * 0.14 });
  const byId = Object.fromEntries(stars.map((s) => [s.id, s]));
  const at = (id) => ({ x: boxX + byId[id].x, y: boxY + byId[id].y });

  // 학생의 상상선은 별과 연결선 뒤에 놓아 관찰한 별의 배열을 가리지 않는다.
  if (isUsableSketch(constellation.sketch) && constellation.sketch.strokes.length) {
    ctx.save();
    roundRect(ctx, boxX, boxY, boxSize, boxSize, 20);
    ctx.clip();
    ctx.strokeStyle = 'rgba(120, 197, 197, 0.62)';
    ctx.lineWidth = boxSize * 0.021;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(120, 197, 197, 0.35)';
    ctx.shadowBlur = 10;
    for (const stroke of constellation.sketch.strokes) {
      ctx.beginPath();
      stroke.forEach(([x, y], index) => {
        const px = boxX + x * boxSize / 100;
        const py = boxY + y * boxSize / 100;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  // 선 — 넓고 흐린 빛 위에 가늘고 밝은 심지
  for (const pass of [
    { color: 'rgba(232, 193, 88, 0.22)', width: 14 },
    { color: 'rgba(255, 243, 207, 0.92)', width: 3.5 },
  ]) {
    ctx.strokeStyle = pass.color;
    ctx.lineWidth = pass.width;
    ctx.lineCap = 'round';
    for (const [a, b] of constellation.lines) {
      if (!byId[a] || !byId[b]) continue;
      const p1 = at(a);
      const p2 = at(b);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  for (const s of stars) {
    const r = radiusForMagnitude(s.mag, { min: 13, max: 28 });
    drawGlint(ctx, boxX + s.x, boxY + s.y, r, s.isPolaris ? '#FFE9A8' : COLORS.star);
  }

  // ---------- 글 ----------
  const centerX = W / 2;
  ctx.textAlign = 'center';

  // 칭호 — 그림 바로 위
  ctx.font = `400 40px ${body}`;
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`「 ${constellation.card?.epithet ?? ''} 」`, centerX, boxY - 34);

  // 권능 — 길면 줄을 나눈다(최대 3줄). 아래에서부터 쌓아 올린다.
  ctx.font = `400 34px ${body}`;
  const powerLines = wrapText(
    ctx,
    constellation.card?.power ?? '',
    W - pad * 2 - 140
  ).slice(0, 3);

  ctx.fillStyle = COLORS.text;
  powerLines.forEach((line, i) => {
    const y = powerBottom - (powerLines.length - 1 - i) * powerLineH;
    ctx.fillText(line, centerX, y);
  });

  // 이름 — 권능 첫 줄 위에
  const nameY = powerBottom - (powerLines.length - 1) * powerLineH - 66;
  ctx.font = `400 72px ${display}`;
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(constellation.name, centerX, nameY);

  // 만든 사람 (적지 않았으면 건너뛴다)
  if (constellation.author) {
    ctx.font = `400 30px ${body}`;
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`만든 사람 · ${constellation.author}`, centerX, authorY);
  }

  // 아래쪽 표시 — 항상 카드 맨 아래 고정
  ctx.font = `400 26px ${body}`;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('폴라리스의 별자리 · 나의 밤하늘 도감', centerX, footerY);

  return canvas;
}

/** 파일 이름으로 쓸 수 없는 글자를 걸러낸다. */
export function safeFileName(name) {
  return (
    String(name || '나의성좌')
      .replace(/[\\/:*?"<>|]/g, '')
      .trim()
      .slice(0, 40) || '나의성좌'
  );
}

/**
 * 카드에 쓰는 글꼴을 실제로 내려받아 둔다.
 *
 * `document.fonts.ready`만 기다리면 부족하다. 그것은 **화면에 이미 쓰이고 있는**
 * 글꼴만 기다리는데, 카드 이름에 쓰는 BMDoHyeon은 화면 어디에도 쓰이지 않아
 * 그때까지 내려받지 않은 상태다. 그대로 그리면 캔버스는 조용히 기본 글꼴로
 * 대체해 버리고, 기기마다 다른 카드가 저장된다.
 */
async function loadCardFonts() {
  try {
    await Promise.all([
      document.fonts?.load(`400 72px ${DISPLAY_FONT}`),
      document.fonts?.load(`400 40px ${BODY_FONT}`),
    ]);
    await document.fonts?.ready;
  } catch {
    /* 글꼴을 못 받아도 그리기는 계속한다 */
  }
}

/**
 * 성좌 카드를 PNG 파일로 내려받는다.
 * @returns {Promise<boolean>} 저장이 시작되었으면 true
 */
export async function downloadCardImage(constellation) {
  await loadCardFonts();

  const canvas = document.createElement('canvas');
  drawCard(canvas, constellation);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeFileName(constellation.name)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // 브라우저가 저장을 시작할 시간을 준 뒤 정리한다
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}

/* ------------------------------------------------------------------
   AI에게 줄 별자리 참고 그림
------------------------------------------------------------------ */

/** 참고 그림 크기 — 이미지 생성기에 넣기 좋은 정사각형. */
const REF_SIZE = 1024;

/**
 * 별자리만 크게 그린 참고 그림을 만든다.
 *
 * 이야기 마지막 컷은 "실제 별자리 위에 옛사람의 상상도를 얹은" 그림이다.
 * 그러려면 AI가 **정확한 별 배치에 맞춰** 곰·왕비·용을 그려야 하는데,
 * 말로 설명해서는 맞출 수 없다. 이 그림을 함께 올려 주고
 * "이 별 배치에 맞춰 몸을 그려 달라"고 하면 훨씬 잘 맞는다.
 *
 * (최종 그림에서 별은 어차피 앱이 다시 정확하게 얹으므로,
 *  AI가 별을 조금 어긋나게 그려도 결과는 정확하다)
 */
export function drawConstellationReference(canvas, constellation) {
  const ctx = canvas.getContext('2d');
  canvas.width = REF_SIZE;
  canvas.height = REF_SIZE;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, REF_SIZE, REF_SIZE);

  const { stars } = fitConstellationToBox(constellation, {
    size: REF_SIZE,
    padding: 150,
  });
  const byId = Object.fromEntries(stars.map((s) => [s.id, s]));

  // 선 — 굵고 밝게. AI가 배치를 또렷하게 읽을 수 있어야 한다.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const [a, b] of constellation.lines) {
    if (!byId[a] || !byId[b]) continue;
    ctx.beginPath();
    ctx.moveTo(byId[a].x, byId[a].y);
    ctx.lineTo(byId[b].x, byId[b].y);
    ctx.stroke();
  }

  for (const s of stars) {
    const r = radiusForMagnitude(s.mag, { min: 16, max: 34 });
    drawGlint(ctx, s.x, s.y, r, s.isPolaris ? '#FFE9A8' : COLORS.star);
  }

  return canvas;
}

/** 별자리 참고 그림을 PNG로 내려받는다 (개발·삽화 제작용). */
export async function downloadConstellationReference(constellation) {
  const canvas = document.createElement('canvas');
  drawConstellationReference(canvas, constellation);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `참고-${safeFileName(constellation.name)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return true;
}

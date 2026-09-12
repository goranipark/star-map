/** 0~1 사이를 부드럽게 잇는다. */
const smoothstep = (edge0, edge1, value) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * 성도 삽화의 남색 바탕을 완전히 투명하게 만드는 알파값.
 * 금빛 판화선은 R·G가 B보다 강하고, 별빛은 중성색이지만 매우 밝다는 점을 쓴다.
 */
export function goldCutoutAlpha(r, g, b, alpha = 255) {
  if (alpha === 0) return 0;
  const goldSignal = r + g - b * 2;
  const brightStarSignal = (r + g + b) / 3 - 135;
  const signal = Math.max(goldSignal, brightStarSignal);
  return Math.round(alpha * smoothstep(14, 86, signal));
}

/** Canvas ImageData의 RGB는 유지하고 배경 알파만 실제로 제거한다. */
export function cutOutNavyBackground(pixelData) {
  for (let i = 0; i < pixelData.length; i += 4) {
    const alpha = goldCutoutAlpha(
      pixelData[i],
      pixelData[i + 1],
      pixelData[i + 2],
      pixelData[i + 3]
    );
    pixelData[i + 3] = alpha;
    // 완전 투명 픽셀의 색도 비워 PNG 압축과 보간 시 생길 수 있는 남색 테두리를 막는다.
    if (alpha === 0) {
      pixelData[i] = 0;
      pixelData[i + 1] = 0;
      pixelData[i + 2] = 0;
    }
  }
  return pixelData;
}

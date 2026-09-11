/** 화면 비율에 맞춰 현재 별과 북극성을 여백 안에 담는 카메라. */
export function fitBoardCamera(points, width, height, padding = 8) {
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    scale: Math.min(
      (width - padding * 2) / Math.max(1, maxX - minX),
      (height - padding * 2) / Math.max(1, maxY - minY),
      6
    ),
  };
}

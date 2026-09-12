/** 별자리 상상화는 이미지 대신 작은 좌표 목록으로 저장한다. */
export const MAX_SKETCH_STROKES = 36;
export const MAX_SKETCH_POINTS = 140;
export const MIN_POINT_DISTANCE = 0.7;

export function emptySketch() {
  return { version: 1, strokes: [] };
}

export function isUsableSketch(sketch) {
  if (!sketch || sketch.version !== 1 || !Array.isArray(sketch.strokes)
    || sketch.strokes.length > MAX_SKETCH_STROKES) return false;
  for (const stroke of sketch.strokes) {
    if (!Array.isArray(stroke) || stroke.length < 2 || stroke.length > MAX_SKETCH_POINTS) return false;
    for (const point of stroke) {
      if (!Array.isArray(point) || point.length !== 2
        || !Number.isFinite(point[0]) || !Number.isFinite(point[1])
        || point[0] < 0 || point[0] > 100 || point[1] < 0 || point[1] > 100) return false;
    }
  }
  return true;
}

export function appendSketchPoint(points, point) {
  if (points.length >= MAX_SKETCH_POINTS) return points;
  const previous = points.at(-1);
  if (previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) < MIN_POINT_DISTANCE) {
    return points;
  }
  return [...points, point];
}

export function sketchPath(points) {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
}

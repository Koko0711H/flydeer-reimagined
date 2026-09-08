/** @param {number} value @param {number} min @param {number} max */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** @param {number} progress @param {number} count */
export function productChapter(progress, count) {
  const travel = clamp(progress, 0, 1) * count;
  const index = Math.min(count - 1, Math.floor(travel));
  return { index, phase: clamp(travel - index, 0, 1) };
}

/** @param {number} index @param {number} focus @param {number} width */
export function arcPose(index, focus, width) {
  const d = index - focus;
  const distance = Math.abs(d);
  return {
    x: d * width * 0.69,
    y: Math.min(150, distance ** 1.6 * 26),
    z: -distance * 150,
    rotateY: clamp(-d * 22, -65, 65),
    rotateZ: clamp(d * 4.2, -17, 17),
    opacity: clamp(3.8 - distance, 0, 1),
    zIndex: 20 - Math.round(distance),
  };
}

/** Small SVG helpers shared by the chart and dial components. */

export interface Point {
  x: number
  y: number
}

/**
 * Catmull-Rom → cubic bezier, so a handful of data points read as the soft
 * curve used in the references rather than a polyline.
 */
export function smoothPath(points: Point[], tension = 0.85): string {
  if (points.length === 0) return ''
  if (points.length < 3) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  }

  let path = `M${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension

    path += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`
  }
  return path
}

/** Point on a circle, with 0° at 12 o'clock and angles running clockwise. */
export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  degrees: number,
): Point {
  const radians = ((degrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

/** Arc path between two angles (degrees, clockwise from 12 o'clock). */
export function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarPoint(cx, cy, radius, startAngle)
  const end = polarPoint(cx, cy, radius, endAngle)
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
  const sweep = endAngle > startAngle ? 1 : 0
  return `M${start.x} ${start.y} A${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`
}

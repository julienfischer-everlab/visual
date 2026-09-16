import { useEffect, useRef } from 'react'
import { organInks, type OrganCloud, type OrganPointSet } from '../../data/organAge'
import './OrganParticles.css'

/**
 * The particle organ, painted with the reference's own 2D rules:
 *
 * - the cloud breathes, and the heart beats, on the reference's pulse
 * - each dot drifts on its own seeded phase and twinkles between 0.8 and 1.0
 * - a dot at the front of the volume is drawn a fifth larger than one behind it
 * - opacity is snapped to the reference's twenty-step 5% grid
 * - dots are bucketed by ink × opacity step and filled as paths, as the
 *   reference's painter batches them
 * - on a pale ground the reference's light inks and its measured alpha lift
 *   (2.4×) stand in for the dark theme's three
 */
export function OrganParticles({
  organ,
  inkSet,
  fill = 0.6,
  dot = 1.5,
  alpha = 1,
  still = false,
  className = '',
}: {
  organ: OrganCloud
  /** Which of the reference's two ink sets to paint with. */
  inkSet: 'light' | 'dark'
  /** Share of the box the cloud spans. */
  fill?: number
  /** Dot radius multiplier. */
  dot?: number
  /** View alpha — the locked card dims the whole cloud. */
  alpha?: number
  still?: boolean
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Read through refs so a prop change never restarts the animation.
  const props = useRef({ organ, inkSet, fill, dot, alpha, still })
  props.current = { organ, inkSet, fill, dot, alpha, still }

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const TAU = Math.PI * 2
    const OP_STEP = 0.05
    const STEPS = 20
    // The grid the reference snaps every opacity to, as ready-made fills.
    const inkCache = new Map<string, string>()
    const colorFor = (set: 'light' | 'dark', k: number, step: number) => {
      const key = `${set}${k}-${step}`
      let value = inkCache.get(key)
      if (!value) {
        const rgb = (set === 'light' ? organInks.light : organInks.dark)[k]
        value = `rgba(${rgb},${(step * OP_STEP).toFixed(2)})`
        inkCache.set(key, value)
      }
      return value
    }
    const opStep = (v: number) =>
      v < 0.5 * OP_STEP ? 0 : Math.min(STEPS, Math.round(v / OP_STEP))

    let raf = 0
    let w = 0
    let h = 0

    const sizeTo = () => {
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(3, Math.max(2, Math.round(window.devicePixelRatio || 1)))
      const nextW = Math.round(rect.width * dpr)
      const nextH = Math.round(rect.height * dpr)
      if (nextW === w && nextH === h) return
      w = nextW
      h = nextH
      canvas.width = w
      canvas.height = h
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    const paintSet = (
      set: OrganPointSet,
      stride: 3 | 2,
      sc: number,
      ox: number,
      oy: number,
      T: number,
      drift: number,
      themeA: number,
      viewAlpha: number,
      inkSetNow: 'light' | 'dark',
      dotMul: number,
      motion: boolean,
    ) => {
      const buckets = new Map<string, Path2D>()
      const count = set.r.length
      for (let i = 0; i < count; i++) {
        const qx = set.xyz[i * stride]
        const qy = set.xyz[i * stride + 1]
        const qz = stride === 3 ? set.xyz[i * stride + 2] : 0
        const phase = set.s[i]

        const jx = motion ? drift * Math.sin(T * 0.8 + phase * 6.28) : 0
        const jy = motion ? drift * Math.cos(T * 0.7 + phase * 9.42) : 0
        const twinkle = motion ? 0.8 + 0.2 * Math.sin(T * 1.8 + phase * 21) : 0.9

        // depth in the size, as the reference's painter does
        const depth = 0.9 + 0.2 * Math.min(1, Math.max(0, qz / 0.9 + 0.5))
        const r = set.r[i] * depth * dotMul
        const step = opStep(set.a[i] * twinkle * viewAlpha * themeA)
        if (step <= 0 || r <= 0) continue

        const key = `${set.k[i]}-${step}`
        let path = buckets.get(key)
        if (!path) {
          path = new Path2D()
          buckets.set(key, path)
        }
        const x = ox + qx * sc + jx
        const y = oy - qy * sc + jy
        path.moveTo(x + r, y)
        path.arc(x, y, r, 0, TAU)
      }

      buckets.forEach((path, key) => {
        const [k, step] = key.split('-')
        ctx.fillStyle = colorFor(inkSetNow, Number(k), Number(step))
        ctx.fill(path)
      })
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden || host.offsetParent === null) return
      sizeTo()
      if (!w || !h) return

      const {
        organ: organNow,
        inkSet: inkSetNow,
        fill: fillNow,
        dot: dotNow,
        alpha: alphaNow,
        still: stillNow,
      } = props.current
      const motion = !stillNow && !reduced
      const T = t / 1000

      // the reference's pulse: the heart beats, everything else breathes
      const u = (t % 1100) / 1100
      const pulse = !motion
        ? 1
        : organNow.beat
          ? 1 +
            0.028 * Math.exp(-Math.pow(u - 0.1, 2) / 0.004) +
            0.016 * Math.exp(-Math.pow(u - 0.32, 2) / 0.006)
          : 1 + 0.01 * Math.sin(t * 0.0009)

      const sc = Math.min(w, h) * fillNow * pulse
      const ox = w / 2
      const oy = h / 2
      const drift = 0.006 * 0.7 * sc
      // the light theme buys its contrast with less alpha, so it spends more
      const themeA = inkSetNow === 'light' ? organInks.lightLift2D : 1
      const dpr = w / Math.max(1, host.getBoundingClientRect().width)
      const dotMul = dotNow * (dpr / 2)

      ctx.clearRect(0, 0, w, h)
      paintSet(organNow.strays, 2, sc, ox, oy, T, drift * 1.8, themeA, alphaNow * 0.8, inkSetNow, dotMul, motion)
      paintSet(organNow.cloud, 3, sc, ox, oy, T, drift, themeA, alphaNow, inkSetNow, dotMul, motion)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className={`organ-particles ${className}`.trim()} ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}

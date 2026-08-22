import { useEffect, useMemo, useState, type CSSProperties } from 'react'

/**
 * Launch splash — LOCKED (Aug 2026)
 *
 * Do not change without explicit user request:
 * - TUDU wordmark slide-in, font wait, gradient + drop shadows
 * - Hero pin position behind TUDU (tip 1/8 word-height above letter bottom)
 * - 8 satellite pin layout (SATELLITE_LAYOUT), z-index sandwich, stagger timing
 * - Off-screen pin drop (-100vh), bounce/squish, ground shadows on all pins
 * - Oval landing ripple on all pins (hidden until impact, forwards fill)
 * - Warm cream gradient background
 */
type Phase = 'idle' | 'play' | 'exit' | 'done'

const WORDMARK_ARRIVE_S = 0.75
const WORDMARK_FONT = '800 1em "Plus Jakarta Sans"'
const FONT_READY_TIMEOUT_MS = 500

async function waitForWordmarkFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  await Promise.race([
    document.fonts.load(WORDMARK_FONT).catch(() => undefined),
    document.fonts.ready,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, FONT_READY_TIMEOUT_MS)
    }),
  ])
}

const HERO_DROP_DELAY_S = WORDMARK_ARRIVE_S + 0.12
const HERO_DROP_DURATION_S = 0.45
const SATELLITE_DROP_DURATION_S = 0.45
const SATELLITE_START_DELAY_S = HERO_DROP_DELAY_S + 0.4
const SATELLITE_STAGGER_S = 0.14

const SPLASH_PLAY_MS = 4600
const SPLASH_EXIT_MS = 450

const LAUNCH_LOGO_PX = 200
const SATELLITE_BASE_SIZE = 52

/**
 * Fixed landing spots matched to reference screenshot.
 * Positions are % of the lockup box (tip anchor = bottom edge of each pin).
 * LOCKED — do not modify positions/timing without explicit user request.
 */
const SATELLITE_LAYOUT = [
  { id: 'sat-tr', left: '67%', bottom: '82%', scale: 0.32, inFront: false, rotate: 4 },
  { id: 'sat-fl', left: '7%', bottom: '58%', scale: 0.38, inFront: false, rotate: -3 },
  { id: 'sat-nl', left: '25%', bottom: '62%', scale: 0.44, inFront: true, rotate: 2 },
  { id: 'sat-bl', left: '16%', bottom: '30%', scale: 0.56, inFront: true, rotate: -2 },
  { id: 'sat-bc', left: '44%', bottom: '34%', scale: 0.58, inFront: true, rotate: 0 },
  { id: 'sat-mrh', left: '70%', bottom: '72%', scale: 0.4, inFront: false, rotate: -4 },
  { id: 'sat-mrl', left: '82%', bottom: '46%', scale: 0.54, inFront: true, rotate: 3 },
  { id: 'sat-br', left: '77%', bottom: '26%', scale: 0.64, inFront: false, rotate: 2 },
] as const

type Pin = (typeof SATELLITE_LAYOUT)[number] & {
  size: number
  delay: number
  duration: number
}

function buildSatellitePins(): Pin[] {
  return SATELLITE_LAYOUT.map((slot, index) => ({
    ...slot,
    size: SATELLITE_BASE_SIZE,
    delay: SATELLITE_START_DELAY_S + index * SATELLITE_STAGGER_S,
    duration: SATELLITE_DROP_DURATION_S,
  }))
}

export default function LaunchSplash() {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'done'
      : 'idle',
  )
  const satellitePins = useMemo(() => buildSatellitePins(), [])
  const backPins = useMemo(() => satellitePins.filter((pin) => !pin.inFront), [satellitePins])
  const frontPins = useMemo(() => satellitePins.filter((pin) => pin.inFront), [satellitePins])

  useEffect(() => {
    if (phase !== 'idle') return
    let cancelled = false
    void waitForWordmarkFont().then(() => {
      if (!cancelled) setPhase('play')
    })
    return () => {
      cancelled = true
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'play') return
    const exitTimer = window.setTimeout(() => setPhase('exit'), SPLASH_PLAY_MS)
    const doneTimer = window.setTimeout(() => setPhase('done'), SPLASH_PLAY_MS + SPLASH_EXIT_MS)
    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
    }
  }, [phase])

  if (phase === 'done') return null

  const isPlaying = phase === 'play' || phase === 'exit'

  const renderSatellite = (pin: Pin) => (
    <div
      key={pin.id}
      className="launch-splash__sat"
      style={
        {
          '--sat-left': pin.left,
          '--sat-bottom': pin.bottom,
          '--pin-size': `${pin.size}px`,
          '--pin-scale': String(pin.scale),
          '--pin-delay': `${pin.delay}s`,
          '--pin-duration': `${pin.duration}s`,
          '--pin-squish-delay': `${pin.delay + pin.duration * 0.68}s`,
          '--pin-rotate': `${pin.rotate}deg`,
        } as CSSProperties
      }
    >
      <div className="launch-splash__pin-shadow" aria-hidden />
      <div className="launch-splash__pin-ripple" aria-hidden />
      <div className="launch-splash__pin-drop">
        <div className="launch-splash__pin-squish">
          <img
            src="/tudu-pin-logo.png"
            alt=""
            className="launch-splash__pin-mark"
            width={pin.size}
            height={pin.size}
            draggable={false}
          />
        </div>
      </div>
    </div>
  )

  return (
    <div
      className={`launch-splash ${phase === 'exit' ? 'launch-splash--exit' : ''} ${isPlaying ? 'launch-splash--play' : ''}`}
      aria-hidden
    >
      <div className="launch-splash__cluster">
        <div className="launch-splash__lockup">
          {isPlaying && (
            <>
              <div className="launch-splash__layer launch-splash__layer--back">
                <div
                  className="launch-splash__hero"
                  style={
                    {
                      '--pin-delay': `${HERO_DROP_DELAY_S}s`,
                      '--pin-duration': `${HERO_DROP_DURATION_S}s`,
                      '--pin-squish-delay': `${HERO_DROP_DELAY_S + HERO_DROP_DURATION_S * 0.68}s`,
                      '--pin-scale': '1',
                    } as CSSProperties
                  }
                >
                  <div className="launch-splash__pin-shadow launch-splash__pin-shadow--hero" aria-hidden />
                  <div className="launch-splash__pin-ripple launch-splash__pin-ripple--hero" aria-hidden />
                  <div className="launch-splash__pin-drop">
                    <div className="launch-splash__pin-squish">
                      <img
                        src="/tudu-pin-logo.png"
                        alt=""
                        className="launch-splash__pin-mark launch-splash__pin-mark--hero"
                        width={LAUNCH_LOGO_PX}
                        height={LAUNCH_LOGO_PX}
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
                {backPins.map(renderSatellite)}
              </div>

              <div className="launch-splash__wordmark-wrap">
                <div className="launch-splash__wordmark-drop">
                  <div className="launch-splash__wordmark-squish">
                    <p className="launch-splash__wordmark tracking-tight">TUDU</p>
                  </div>
                </div>
              </div>

              <div className="launch-splash__layer launch-splash__layer--front">
                {frontPins.map(renderSatellite)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

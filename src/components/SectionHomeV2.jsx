/**
 * SectionHomeV2 — Fresh take on the hero sequence.
 *
 * 4 beats, clean crossfades, nothing carries over between slides.
 *
 *  0  "Thousands of deeds."          — scrolling deed tiles
 *  1  "Every deed becomes a shape."  — shape draws large + centered
 *  2  "Every shape tells a story."   — map card
 *  3  "Connected to your workflow."  — UI screenshot
 */

import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { cn } from '../lib/utils'

import deed1 from '../assets/deeds/deed-01.png'
import deed2 from '../assets/deeds/deed-02.png'
import deed3 from '../assets/deeds/deed-03.png'
import deed4 from '../assets/deeds/deed-04.png'
import deed5 from '../assets/deeds/deed-05.png'
import mapImage      from '../assets/map-with-shape.png'
import uiScreenshot  from '../assets/ui-screenshot.jpg'

// ── Constants ─────────────────────────────────────────────────────────────────

const DEED_IMAGES   = [deed1, deed2, deed3, deed4, deed5]
const CARD_W        = 158
const CARD_H        = 205
const CARD_GAP      = 14
const TILES_PER_ROW = 12
const CYCLE_W       = TILES_PER_ROW * (CARD_W + CARD_GAP)
const ROW_SPEEDS    = [32, 40, 26]
const ROW_OFFSETS   = [0, CYCLE_W * 0.38, CYCLE_W * 0.71]

const SHAPE_PATH     = 'M761.667 2.5H563.667V18.5C544.467 10.5 355.667 85.1667 263.667 123.5L249.667 101.5L1.66699 323.5C333.667 109.1 646.667 37.5 761.667 28.5V2.5Z'
const SHAPE_PATH_LEN = 1950

// How long to sit on each beat before auto-advancing
const BEAT_DURATIONS = [4500, 8500, 4000, 5500]

// ── Component ─────────────────────────────────────────────────────────────────

export default function SectionHomeV2({ autoplay, active, onComplete }) {
  const [beat, setBeat]         = useState(0)
  const [svgProgress, setSvgProgress] = useState(0)
  const [shapeDone, setShapeDone]     = useState(false)
  // Increments on every beat entry so text content re-mounts and re-animates
  const [animKey, setAnimKey]   = useState(0)

  const rowInnerRefs = useRef([null, null, null])
  const scrollTls    = useRef([])
  const timerRef     = useRef(null)
  const activeTl     = useRef(null)
  const prevBeat     = useRef(-1)
  const progressObj  = useRef({ value: 0 })

  // ── Reset when section scrolls back into view ──────────────────────────────
  useEffect(() => {
    if (active) {
      clearTimeout(timerRef.current)
      setBeat(0)
    }
  }, [active])

  // ── Beat timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setBeat(b => {
        const next = b + 1
        if (next >= BEAT_DURATIONS.length) {
          if (autoplay) onComplete?.()
          return 0
        }
        return next
      })
    }, BEAT_DURATIONS[beat])
    return () => clearTimeout(timerRef.current)
  }, [beat, autoplay])

  // ── Beat entry ─────────────────────────────────────────────────────────────
  useEffect(() => {
    prevBeat.current = beat
    activeTl.current?.kill()
    setAnimKey(k => k + 1)   // re-trigger text animations every beat

    if      (beat === 0) enterBeat0()
    else if (beat === 1) enterBeat1()
    else {
      setSvgProgress(1)        // shape stays complete on beats 2-3
    }
  }, [beat])

  // ─────────────────────────────────────────────────────────────────────────

  function enterBeat0() {
    setSvgProgress(0)
    setShapeDone(false)
    scrollTls.current.forEach(tl => tl?.kill())
    requestAnimationFrame(() => {
      scrollTls.current = rowInnerRefs.current.map((el, i) => {
        if (!el) return null
        return gsap.fromTo(el,
          { x: -ROW_OFFSETS[i] },
          { x: -(ROW_OFFSETS[i] + CYCLE_W), duration: ROW_SPEEDS[i], ease: 'none', repeat: -1 }
        )
      })
    })
  }

  function enterBeat1() {
    setSvgProgress(0)
    setShapeDone(false)
    scrollTls.current.forEach(tl => tl?.kill())

    progressObj.current.value = 0
    const tween = gsap.to(progressObj.current, {
      value: 1,
      duration: 5.5,
      ease: 'power1.inOut',   // builds then eases to rest — purposeful, mechanical
      delay: 0.4,
      onUpdate: () => setSvgProgress(progressObj.current.value),
      onComplete: () => setShapeDone(true),
    })
    activeTl.current = tween
  }

  const goToBeat = (b) => {
    clearTimeout(timerRef.current)
    setBeat(b)
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fafbfc] pb-14">

      {/* ══ BEAT 0: Scrolling deed tiles ═════════════════════════════════ */}
      <Beat visible={beat === 0}>
        {/* Scrolling rows fill the space */}
        <div className="absolute inset-0 flex flex-col pb-14">
          <div className="flex-shrink-0 pt-14 pb-8 text-center pointer-events-none">
            <BeatText animKey={animKey} visible={beat === 0}>
              <h1 className="text-[60px] font-bold text-primary tracking-tight leading-none">
                Thousands of deeds.
              </h1>
              <p className="mt-4 text-xl text-[#5a6b7b] font-light" style={{ animationDelay: '0.25s' }}>
                Handwritten. Scanned. Unstructured. Unsearchable.
              </p>
            </BeatText>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4 overflow-hidden">
            {[0, 1, 2].map(rowIdx => (
              <div key={rowIdx} className="overflow-hidden flex-shrink-0" style={{ height: CARD_H }}>
                <div
                  ref={el => rowInnerRefs.current[rowIdx] = el}
                  className="flex h-full"
                  style={{ gap: CARD_GAP, width: 'max-content' }}
                >
                  {Array.from({ length: TILES_PER_ROW * 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded-lg overflow-hidden"
                      style={{
                        width: CARD_W, height: CARD_H,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <img
                        src={DEED_IMAGES[(i + rowIdx * 3) % DEED_IMAGES.length]}
                        alt="" draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Beat>

      {/* ══ BEAT 1: Shape draws — the moment of transformation ════════════ */}
      <Beat visible={beat === 1}>
        <div className="flex flex-col items-center justify-center h-full gap-0 px-10">

          {/* Headline */}
          <BeatText animKey={animKey} visible={beat === 1} className="text-center mb-6">
            <h1 className="text-[54px] font-bold text-primary tracking-tight leading-none">
              Every deed becomes a shape.
            </h1>
            <p className="mt-3 text-lg text-[#5a6b7b] font-light" style={{ animationDelay: '0.3s' }}>
              Automatic extraction. Every page. Every instrument.
            </p>
          </BeatText>

          {/* Shape — takes center stage */}
          <div
            style={{
              width: '88%',
              maxWidth: 860,
              opacity: beat === 1 ? 1 : 0,
              transition: 'opacity 0.5s ease 0.2s',
            }}
          >
            <svg
              width="100%"
              viewBox="0 0 765 326"
              style={{ display: 'block', overflow: 'visible' }}
            >
              {/* Drawing stroke */}
              <path
                d={SHAPE_PATH}
                fill="none"
                stroke="#16a3d6"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: SHAPE_PATH_LEN,
                  strokeDashoffset: SHAPE_PATH_LEN * (1 - svgProgress),
                }}
              />
              {/* Fill blooms in when drawing completes */}
              <path
                d={SHAPE_PATH}
                fill="#16a3d6"
                style={{
                  fillOpacity: svgProgress >= 0.98 ? 0.88 : 0,
                  transition: 'fill-opacity 0.8s ease',
                }}
              />
            </svg>
          </div>

          {/* Status badge below shape */}
          <div className="mt-5 h-8 flex items-center justify-center">
            {!shapeDone && svgProgress > 0.02 && (
              <div
                className="flex items-center gap-2 text-sm text-[#5a6b7b]"
                style={{ animation: 'fadeIn 0.4s ease forwards' }}
              >
                <div
                  className="w-2 h-2 rounded-full bg-cyan"
                  style={{ animation: 'processingPulse 1s ease-in-out infinite' }}
                />
                Processing…
              </div>
            )}
            {shapeDone && (
              <div
                className="flex items-center gap-2 text-sm font-medium text-primary"
                style={{ animation: 'fadeInUp 0.5s ease forwards' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#16a3d6" strokeWidth="1.5" />
                  <path d="M5 8.5l2 2 4-4" stroke="#16a3d6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Extraction complete
              </div>
            )}
          </div>

        </div>
      </Beat>

      {/* ══ BEAT 2: Map — shape in geographic context ════════════════════ */}
      <Beat visible={beat === 2}>
        <div className="flex flex-col items-center justify-center h-full gap-7 px-10">
          <BeatText animKey={animKey} visible={beat === 2} className="text-center flex-shrink-0">
            <h1 className="text-[54px] font-bold text-primary tracking-tight leading-none">
              Every shape tells a story.
            </h1>
          </BeatText>
          <div
            className="w-full max-w-5xl rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-2xl flex-shrink-0"
            style={{ animation: 'fadeInUp 0.7s ease 0.35s both' }}
          >
            <img src={mapImage} alt="" className="w-full h-auto block" draggable={false} />
          </div>
        </div>
      </Beat>

      {/* ══ BEAT 3: UI — the full product ════════════════════════════════ */}
      <Beat visible={beat === 3}>
        <div className="flex flex-col items-center justify-center h-full gap-7 px-10">
          <BeatText animKey={animKey} visible={beat === 3} className="text-center flex-shrink-0">
            <h1 className="text-[48px] font-bold text-primary tracking-tight leading-tight">
              Connected to your data,<br />your map, your workflow.
            </h1>
          </BeatText>
          <div
            className="w-full max-w-5xl rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-2xl flex-shrink-0"
            style={{ animation: 'fadeInUp 0.7s ease 0.35s both' }}
          >
            <img src={uiScreenshot} alt="Phase2_Land interface" className="w-full h-auto block" draggable={false} />
          </div>
        </div>
      </Beat>

      {/* ══ Beat dots ════════════════════════════════════════════════════ */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {BEAT_DURATIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => goToBeat(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              beat === i
                ? 'w-4 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-[#e2e8f0] hover:bg-[#5a6b7b]'
            )}
          />
        ))}
      </div>

    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

/**
 * Beat wrapper — cross-fades its children in/out.
 */
function Beat({ visible, children }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.7s ease',
        pointerEvents:  visible ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/**
 * BeatText — remounts on animKey change so CSS entrance re-fires.
 * First child animates in at 0s, subsequent children use animationDelay.
 */
function BeatText({ animKey, visible, children, className }) {
  return (
    <div key={animKey} className={className}>
      {/* Re-key each child for fresh animation */}
      {[].concat(children).map((child, i) =>
        child
          ? <div
              key={i}
              style={{
                opacity: 0,
                animation: visible
                  ? `fadeInUp 0.65s ease ${i === 0 ? '0.1s' : ''} forwards`
                  : 'none',
              }}
            >
              {child}
            </div>
          : null
      )}
    </div>
  )
}

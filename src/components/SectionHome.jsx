import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Hand } from 'lucide-react'
import { cn } from '../lib/utils'

import deed1 from '../assets/deeds/deed-01.png'
import deed2 from '../assets/deeds/deed-02.png'
import deed3 from '../assets/deeds/deed-03.png'
import deed4 from '../assets/deeds/deed-04.png'
import deed5 from '../assets/deeds/deed-05.png'
import uiScreenshot from '../assets/ui-screenshot.jpg'

const DEED_IMAGES = [deed1, deed2, deed3, deed4, deed5]

const CARD_W        = 158
const CARD_H        = 205
const CARD_GAP      = 14
const TILES_PER_ROW = 12
const CYCLE_W       = TILES_PER_ROW * (CARD_W + CARD_GAP)
const ROW_SPEEDS    = [32, 40, 26]
const ROW_OFFSETS   = [0, CYCLE_W * 0.38, CYCLE_W * 0.71]

const GRAB_STACK = [
  { x: -165, y: 30, r: -18, z: 1, scale: 0.91 },
  { x:  -65, y: 14, r:  -8, z: 2, scale: 0.96 },
  { x:    0, y:   0, r:  -2, z: 5, scale: 1.00 },
  { x:   58, y: 12, r:   7, z: 3, scale: 0.96 },
  { x:  130, y: 24, r:  15, z: 4, scale: 0.91 },
]

const TIGHT_STACK = [
  { x: -82, y: 16, r: -10, scale: 0.93 },
  { x: -32, y:  7, r:  -5, scale: 0.97 },
  { x:   0, y:  0, r:  -1, scale: 1.00 },
  { x:  29, y:  6, r:   4, scale: 0.97 },
  { x:  65, y: 13, r:   9, scale: 0.93 },
]

const STEPS = [
  'Extract Pages',
  'Post-Process',
  'Group Instruments',
  'Process Instruments',
  'Extract Spatial',
  'Optimize Spatial',
]

// 5 beats: tiles+text-transition → upload → shape+process → text transition → UI
const BEAT_DURATIONS = [7000, 12000, 9000, 3800, 9000]

const SHAPE_PATH     = 'M761.667 2.5H563.667V18.5C544.467 10.5 355.667 85.1667 263.667 123.5L249.667 101.5L1.66699 323.5C333.667 109.1 646.667 37.5 761.667 28.5V2.5Z'
const SHAPE_PATH_LEN = 1950

export default function SectionHome({ autoplay, active, onComplete }) {
  const [beat, setBeat]                   = useState(0)
  const [showStack, setShowStack]         = useState(false)
  const [svgProgress, setSvgProgress]     = useState(0)
  const [checkedSteps, setCheckedSteps]   = useState([])
  const [shapeDone, setShapeDone]         = useState(false)
  const [uploadDropped, setUploadDropped] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [animKey, setAnimKey]             = useState(0)
  const [resetKey, setResetKey]           = useState(0)

  const rowInnerRefs  = useRef([null, null, null])
  const stackGroupRef = useRef(null)
  const stackRefs     = useRef([])
  const handRef       = useRef(null)
  const uploadZoneRef = useRef(null)
  const phrase1Ref    = useRef(null)
  const phrase2Ref    = useRef(null)
  const b0Phrase1Ref  = useRef(null)
  const b0Phrase2Ref  = useRef(null)
  const b0SubRef      = useRef(null)

  const timerRef    = useRef(null)
  const stepTimers  = useRef([])
  const scrollTls   = useRef([])
  const activeTl    = useRef(null)
  const prevBeat    = useRef(-1)
  const progressObj = useRef({ value: 0 })

  // ── Reset when section scrolls back into view ──────────────────────────────
  useEffect(() => {
    if (active) {
      clearTimeout(timerRef.current)
      setBeat(0)
      setResetKey(k => k + 1)  // forces beat entry effect even if beat is already 0
    }
  }, [active])

  // ── Beat timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setBeat(b => {
        const next = b + 1
        if (next > 4) {
          if (autoplay) onComplete?.()
          return 0
        }
        return next
      })
    }, BEAT_DURATIONS[beat] ?? 4000)
    return () => clearTimeout(timerRef.current)
  }, [beat, autoplay])

  // ── Beat entry ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevBeat.current
    prevBeat.current = beat

    activeTl.current?.kill()
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = []
    setAnimKey(k => k + 1)

    if      (beat === 0) enterBeat0(prev)
    else if (beat === 1) enterBeat1(prev)
    else if (beat === 2) enterBeat2()
    else if (beat === 3) enterBeat3()
  }, [beat, resetKey])

  // ─────────────────────────────────────────────────────────────────────────

  function startScrollAnimations() {
    scrollTls.current.forEach(tl => tl?.kill())
    scrollTls.current = rowInnerRefs.current.map((el, i) => {
      if (!el) return null
      return gsap.fromTo(el,
        { x: -ROW_OFFSETS[i] },
        { x: -(ROW_OFFSETS[i] + CYCLE_W), duration: ROW_SPEEDS[i], ease: 'none', repeat: -1 }
      )
    })
  }

  function stopScrollAnimations() {
    scrollTls.current.forEach(tl => tl?.kill())
    scrollTls.current = []
  }

  function enterBeat0(prev) {
    setShowStack(false)
    setSvgProgress(0)
    setCheckedSteps([])
    setShapeDone(false)
    setUploadDropped(false)
    setShowCheckmark(false)

    if (stackGroupRef.current) gsap.set(stackGroupRef.current, { x: 0, y: 0, scale: 1, opacity: 1 })
    stackRefs.current.forEach(el => el && gsap.set(el, { opacity: 0 }))
    if (handRef.current)       gsap.set(handRef.current,       { opacity: 0 })
    if (uploadZoneRef.current) gsap.set(uploadZoneRef.current, { opacity: 0, x: 80 })

    // Hard reset: tile elements may have GSAP transforms from beat 1's collapse animation
    gsap.set(document.querySelectorAll('.deed-scroll-tile'), { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 })
    // Reset row containers to start position
    rowInnerRefs.current.forEach((el, i) => el && gsap.set(el, { x: -ROW_OFFSETS[i] }))

    // Hard reset text phrases so the transition starts clean
    if (b0Phrase1Ref.current) gsap.set(b0Phrase1Ref.current.querySelectorAll('span'), { y: 0, opacity: 0 })
    if (b0Phrase2Ref.current) gsap.set(b0Phrase2Ref.current.querySelectorAll('span'), { y: 0, opacity: 0 })
    if (b0SubRef.current)     gsap.set(b0SubRef.current, { opacity: 1 })

    requestAnimationFrame(() => {
      startScrollAnimations()
      runBeat0TextTransition()
    })
  }

  function runBeat0TextTransition() {
    const p1 = b0Phrase1Ref.current
    const p2 = b0Phrase2Ref.current
    if (!p1 || !p2) return

    const words1 = p1.querySelectorAll('span')
    const words2 = p2.querySelectorAll('span')

    const sub = b0SubRef.current
    const tl = gsap.timeline()
    // Phrase 1 staggers in
    tl.fromTo(words1,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.65, ease: 'power3.out', delay: 0.3 }
    )
    // Subcaption fades out before the headline exits
    .to(sub, { opacity: 0, duration: 0.35, ease: 'power2.in' }, '+=1.6')
    // Headline words exit upward
    .to(words1,
      { y: -36, opacity: 0, stagger: 0.04, duration: 0.4, ease: 'power2.in' },
      '+=0.2'
    )
    // Phrase 2 staggers in
    .fromTo(words2,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.65, ease: 'power3.out' },
      '-=0.05'
    )
  }

  function enterBeat1(prev) {
    stopScrollAnimations()

    if (prev !== 0) {
      setShowStack(true)
      stackRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.set(el, {
          x: GRAB_STACK[i].x, y: GRAB_STACK[i].y,
          rotation: GRAB_STACK[i].r, scale: GRAB_STACK[i].scale,
          opacity: 1, zIndex: GRAB_STACK[i].z,
        })
      })
      scheduleSequence()
      return
    }

    const tiles = Array.from(document.querySelectorAll('.deed-scroll-tile')).filter(el => {
      const r = el.getBoundingClientRect()
      return r.right > 0 && r.left < window.innerWidth
    })

    if (tiles.length === 0) {
      setShowStack(true)
      scheduleSequence()
      return
    }

    const vcx = window.innerWidth / 2
    const vcy = window.innerHeight / 2

    const tl = gsap.timeline({
      onComplete: () => {
        setShowStack(true)
        stackRefs.current.forEach((el, i) => {
          if (!el) return
          gsap.fromTo(el,
            { x: 0, y: 0, rotation: 0, scale: 0.4, opacity: 0 },
            {
              x: GRAB_STACK[i].x, y: GRAB_STACK[i].y,
              rotation: GRAB_STACK[i].r, scale: GRAB_STACK[i].scale,
              opacity: 1, zIndex: GRAB_STACK[i].z,
              duration: 0.62, ease: 'back.out(1.5)',
              delay: i * 0.055,
            }
          )
        })
        scheduleSequence()
      },
    })
    activeTl.current = tl

    tl.to(tiles, {
      x: (_, el) => vcx - (el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2),
      y: (_, el) => vcy - (el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2),
      rotation: () => gsap.utils.random(-35, 35),
      scale: 0.45,
      opacity: 0,
      duration: 0.55,
      ease: 'power3.in',
      stagger: { amount: 0.28, from: 'edges' },
    })
  }

  function scheduleSequence() {
    const t = setTimeout(() => playUploadSequence(), 1300)
    stepTimers.current.push(t)
  }

  function playUploadSequence() {
    const stackEl  = stackGroupRef.current
    const handEl   = handRef.current
    const uploadEl = uploadZoneRef.current
    if (!stackEl || !handEl || !uploadEl) return

    const W = window.innerWidth
    const H = window.innerHeight

    const UPLOAD_W           = 520
    const uploadNaturalLeft  = W * 0.5 + 20
    const uploadCenterX      = uploadNaturalLeft + UPLOAD_W / 2
    const shiftLeft          = -(W * 0.17)
    const dropTargetX        = uploadCenterX - W * 0.5
    const centerDelta        = (W - UPLOAD_W) / 2 - uploadNaturalLeft

    const handInitX      = W * 0.68
    const handInitY      = H * 0.76
    const handOverStackX = (W * 0.5 + shiftLeft) - 22
    const handOverStackY = H * 0.44
    const handDropX      = uploadCenterX - 22
    const handDropY      = H * 0.44

    gsap.set(handEl,   { x: handInitX, y: handInitY, opacity: 0, scale: 0.55 })
    gsap.set(uploadEl, { x: 80, opacity: 0 })

    const tl = gsap.timeline()
    activeTl.current = tl

    tl
      .to(handEl,   { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.3)
      .to(uploadEl, { x: 0, opacity: 1, duration: 0.72, ease: 'power3.out' }, 1.0)
      .to(stackEl,  { x: shiftLeft,     duration: 0.72, ease: 'power3.out' }, 1.0)
      .to(handEl, {
        x: handOverStackX, y: handOverStackY,
        scale: 1.0, duration: 0.82, ease: 'power2.inOut',
      }, 1.5)
      .call(() => {
        stackRefs.current.forEach((el, i) => {
          if (!el) return
          gsap.to(el, {
            x: TIGHT_STACK[i].x, y: TIGHT_STACK[i].y,
            rotation: TIGHT_STACK[i].r, scale: TIGHT_STACK[i].scale,
            duration: 0.26, ease: 'power2.out',
          })
        })
      }, null, 2.52)
      .to(handEl, { scale: 0.88, duration: 0.11, ease: 'power2.in', yoyo: true, repeat: 1 }, 2.55)
      .to(stackEl, { x: dropTargetX, duration: 0.88, ease: 'power2.inOut' }, 2.85)
      .to(handEl,  { x: handDropX, y: handDropY, duration: 0.88, ease: 'power2.inOut' }, 2.85)
      .to(stackEl, { scale: 0.5, opacity: 0, duration: 0.36, ease: 'power2.in' }, 3.73)
      .to(handEl,  { opacity: 0, y: '+=32',  duration: 0.30, ease: 'power2.in' }, 3.76)
      .call(() => setUploadDropped(true), null, 3.88)
      .call(() => setShowCheckmark(true), null, 4.08)
      .to(uploadEl, { x: centerDelta, duration: 0.7, ease: 'power2.inOut' }, 4.3)
      .call(() => {
        clearTimeout(timerRef.current)
        setBeat(2)
      }, null, 5.6)
  }

  function enterBeat2() {
    setSvgProgress(0)
    setCheckedSteps([])
    setShapeDone(false)

    // GSAP-eased shape draw — power1.inOut feels mechanical and purposeful
    progressObj.current.value = 0
    const tween = gsap.to(progressObj.current, {
      value: 1,
      duration: 5.5,
      ease: 'power1.inOut',
      delay: 0.3,
      onUpdate: () => setSvgProgress(progressObj.current.value),
      onComplete: () => setShapeDone(true),
    })
    activeTl.current = tween

    // Steps check off in sync with shape draw (~1s each)
    const STEP_DUR = 1000
    STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCheckedSteps(prev => [...prev, i]), 400 + (i + 1) * STEP_DUR)
      stepTimers.current.push(t)
    })
  }

  function enterBeat3() {
    const p1 = phrase1Ref.current
    const p2 = phrase2Ref.current
    if (!p1 || !p2) return

    const words1 = p1.querySelectorAll('span')
    const words2 = p2.querySelectorAll('span')

    gsap.set([words1, words2], { y: 0, opacity: 0 })

    const tl = gsap.timeline()
    activeTl.current = tl

    tl
      // Phrase 1: words stagger up
      .fromTo(words1,
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.65, ease: 'power3.out' }
      )
      // Hold briefly, then exit words upward
      .to(words1,
        { y: -40, opacity: 0, stagger: 0.04, duration: 0.4, ease: 'power2.in' },
        '+=0.85'
      )
      // Phrase 2: words stagger up right after
      .fromTo(words2,
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.65, ease: 'power3.out' },
        '-=0.05'
      )
  }

  const goToBeat = (b) => {
    clearTimeout(timerRef.current)
    setBeat(b)
  }

  const wallVisible  = beat === 0 || (beat === 1 && !showStack)
  const stackVisible = beat === 1 && showStack

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#fafbfc] pb-14">

      {/* ══ BEAT 0: Scrolling deed tiles ═════════════════════════════════ */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-start pt-[8vh] gap-8 pb-14"
        style={{ opacity: wallVisible ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: wallVisible ? 'auto' : 'none' }}
      >
        {/* Text block — vertically centered with tiles as a unit */}
        <div className="pointer-events-none select-none flex-shrink-0 w-full" style={{ position: 'relative', height: 130 }}>
          {/* Phrase 1: "Thousands of deeds." */}
          <div ref={b0Phrase1Ref} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <h1 className="text-[56px] font-bold text-primary tracking-tight leading-none">
              {'Thousands of deeds.'.split(' ').map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</span>
              ))}
            </h1>
            <p ref={b0SubRef} className="text-xl text-muted-foreground font-light">
              Handwritten. Scanned. Unstructured. Unsearchable.
            </p>
          </div>
          {/* Phrase 2: "This is how Phase2_Land helps." */}
          <div ref={b0Phrase2Ref} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h1 className="text-[56px] font-bold text-primary tracking-tight leading-none">
              {'This is how we help.'.split(' ').map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</span>
              ))}
            </h1>
          </div>
        </div>

        {/* Tile rows */}
        <div className="flex flex-col gap-4 flex-shrink-0 overflow-hidden w-full">
          {[0, 1, 2].map(rowIdx => (
            <div key={rowIdx} className="overflow-hidden" style={{ height: CARD_H }}>
              <div
                ref={el => rowInnerRefs.current[rowIdx] = el}
                className="flex h-full"
                style={{ gap: CARD_GAP, width: 'max-content' }}
              >
                {Array.from({ length: TILES_PER_ROW * 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="deed-scroll-tile flex-shrink-0 rounded-lg overflow-hidden"
                    style={{
                      width: CARD_W, height: CARD_H,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                      willChange: 'transform',
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

      {/* ══ BEAT 1: Stack + Upload sequence ══════════════════════════════ */}
      <div
        className="absolute inset-0"
        style={{ opacity: stackVisible ? 1 : 0, pointerEvents: stackVisible ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}
      >
        <div
          className="absolute top-[10%] left-0 right-0 text-center pointer-events-none"
          style={{ opacity: stackVisible ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}
        >
          <h1 className="text-[52px] font-bold text-primary tracking-tight leading-none">
            It starts with an upload.
          </h1>
          <p className="mt-4 text-xl text-muted-foreground font-light">
            Grab the files. Drop them in.
          </p>
        </div>

        {/* Stack group */}
        <div
          ref={stackGroupRef}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 0, height: 0, willChange: 'transform', zIndex: 10,
          }}
        >
          {DEED_IMAGES.map((src, i) => (
            <div
              key={i}
              ref={el => stackRefs.current[i] = el}
              style={{
                position: 'absolute', width: 195, height: 252,
                marginLeft: -97.5, marginTop: -126,
                willChange: 'transform', opacity: 0,
              }}
            >
              <img
                src={src} alt="" draggable={false}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)',
                }}
              />
            </div>
          ))}
        </div>

        {/* Upload drop zone */}
        <div
          ref={uploadZoneRef}
          style={{
            position: 'absolute',
            left: 'calc(50% + 20px)', top: '50%', marginTop: -190,
            width: 520, height: 380,
            opacity: 0, willChange: 'transform', zIndex: 5,
          }}
        >
          <UploadDropZone dropped={uploadDropped} showCheckmark={showCheckmark} />
        </div>

        {/* Hand cursor */}
        <div
          ref={handRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            opacity: 0, pointerEvents: 'none',
            willChange: 'transform', zIndex: 20,
          }}
        >
          <Hand size={72} strokeWidth={1.5} className="text-primary" fill="white" />
        </div>
      </div>

      {/* ══ BEAT 2: Shape draws centered + pipeline status below ═════════ */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-12 px-10 pb-4"
        style={{ opacity: beat === 2 ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: beat === 2 ? 'auto' : 'none' }}
      >
        {/* Headline */}
        <div
          key={`b2h-${animKey}`}
          className="text-center flex-shrink-0 pointer-events-none"
          style={{ opacity: 0, animation: beat === 2 ? 'fadeInUp 0.65s ease 0.2s forwards' : 'none' }}
        >
          <h1 className="text-[52px] font-bold text-primary tracking-tight leading-none">
            We do the rest.
          </h1>
          <p
            className="mt-3 text-xl text-muted-foreground font-light"
            style={{ opacity: 0, animation: beat === 2 ? 'fadeInUp 0.65s ease 0.45s forwards' : 'none' }}
          >
            Every page. Every instrument. Every spatial reference.
          </p>
        </div>

        {/* Shape — centered, ~20% smaller than full-bleed */}
        <div style={{ width: '70%', maxWidth: 680, flexShrink: 0 }}>
          <svg
            width="100%"
            viewBox="0 0 765 326"
            style={{ display: 'block', overflow: 'visible' }}
          >
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

        {/* Pipeline status bar — UI-element feel */}
        <div
          style={{
            width: '48%', maxWidth: 480, flexShrink: 0,
            opacity: svgProgress > 0.02 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          <PipelineStatus checkedSteps={checkedSteps} shapeDone={shapeDone} />
        </div>
      </div>

      {/* ══ BEAT 3: Text transition — phrase 1 exits, phrase 2 enters ════ */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: beat === 3 ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: beat === 3 ? 'auto' : 'none' }}
      >
        <div className="relative text-center px-10 select-none pointer-events-none">
          {/* Phrase 1 */}
          <div ref={phrase1Ref} className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-[52px] font-bold text-primary tracking-tight leading-none whitespace-nowrap">
              {'Every deed becomes a shape.'.split(' ').map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</span>
              ))}
            </h1>
          </div>
          {/* Phrase 2 */}
          <div ref={phrase2Ref} className="flex items-center justify-center">
            <h1 className="text-[52px] font-bold text-primary tracking-tight leading-none whitespace-nowrap">
              {'Every shape tells a story.'.split(' ').map((w, i) => (
                <span key={i} style={{ display: 'inline-block', marginRight: '0.28em' }}>{w}</span>
              ))}
            </h1>
          </div>
        </div>
      </div>

      {/* ══ BEAT 4: "Connected to your data…" + UI screenshot ════════════ */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-10 pb-16"
        style={{ opacity: beat === 4 ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: beat === 4 ? 'auto' : 'none' }}
      >
        <h1
          key={`b4h-${animKey}`}
          className="text-[48px] font-bold text-primary tracking-tight leading-tight text-center flex-shrink-0"
          style={{ opacity: 0, animation: beat === 4 ? 'fadeInUp 0.65s ease 0.15s forwards' : 'none' }}
        >
          From deed to database. Automatically.
        </h1>
        <img
          key={`b4i-${animKey}`}
          src={uiScreenshot}
          alt="Phase2_Land interface"
          draggable={false}
          className="rounded-2xl border border-border shadow-2xl block flex-shrink-0"
          style={{
            maxWidth: 'min(900px, 100%)',
            maxHeight: 'calc(100vh - 260px)',
            width: 'auto',
            height: 'auto',
            opacity: 0,
            animation: beat === 4 ? 'fadeInUp 0.7s ease 0.4s forwards' : 'none',
          }}
        />
      </div>

      {/* ══ Beat dots ════════════════════════════════════════════════════ */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {BEAT_DURATIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => goToBeat(i)}
            className={cn(
              'rounded-full transition-all duration-300',
              beat === i ? 'w-4 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-border hover:bg-muted-foreground'
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ── Upload drop zone ─────────────────────────────────────────────────────────

function UploadDropZone({ dropped, showCheckmark }) {
  return (
    <div
      className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-5 transition-all duration-500"
      style={{
        background: dropped ? 'rgba(22,163,214,0.05)' : '#f0f4f8',
        border: `2px dashed ${dropped ? '#16a3d6' : '#e2e8f0'}`,
        borderRadius: 20,
      }}
    >
      {showCheckmark ? (
        <AnimatedCheckmark />
      ) : (
        <>
          <div className="text-base font-semibold select-none">
            <span className="text-primary">P2</span>
            <span className="text-cyan">_Land</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">Drag &amp; drop files here</p>
            <p className="text-xs text-muted-foreground mt-1">Or click to browse (Max size 1GB)</p>
          </div>
          <button className="px-5 py-2 border border-border rounded-lg text-sm font-medium text-primary bg-white hover:bg-muted transition-colors">
            Browse Files
          </button>
        </>
      )}
    </div>
  )
}

function AnimatedCheckmark() {
  return (
    <div style={{ animation: 'checkmarkFadeIn 0.4s ease forwards' }}>
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <circle
          cx="44" cy="44" r="34"
          stroke="#16a3d6" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="214" strokeDashoffset="214"
          style={{ animation: 'circleIn 0.55s ease forwards' }}
        />
        <path
          d="M 28 44 L 38 56 L 60 32"
          stroke="#16a3d6" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="52" strokeDashoffset="52"
          style={{ animation: 'checkIn 0.4s ease forwards 0.45s' }}
        />
      </svg>
    </div>
  )
}

// ── Pipeline status (beat 2) — one step at a time, card style ───────────────

function PipelineStatus({ checkedSteps, shapeDone }) {
  const currentStep = checkedSteps.length
  const progress    = Math.round((checkedSteps.length / STEPS.length) * 100)

  return (
    <div
      className="bg-white/80 border border-border/60 rounded-xl overflow-hidden"
      style={{ animation: 'fadeInUp 0.55s ease 0.6s both' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', shapeDone ? 'bg-primary' : 'bg-cyan')}
            style={shapeDone ? {} : { animation: 'processingPulse 0.9s ease-in-out infinite' }}
          />
          <span className="text-xs font-semibold text-primary tracking-wide">
            {shapeDone ? 'Extraction complete' : 'Processing instrument…'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-cyan rounded-full" style={{ width: `${progress}%`, transition: 'width 0.6s ease' }} />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{progress}%</span>
        </div>
      </div>

      {/* Step chips */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 flex-wrap">
        {STEPS.map((step, i) => {
          const done    = checkedSteps.includes(i)
          const current = !done && currentStep === i
          return (
            <div
              key={step}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300',
                done    ? 'bg-primary/10 text-primary'              : '',
                current ? 'bg-cyan/10 text-cyan ring-1 ring-cyan/30' : '',
                !done && !current ? 'bg-muted text-muted-foreground/50' : '',
              )}
            >
              {done ? (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" className="flex-shrink-0">
                  <path d="M1 3.5l2.5 2.5L8 1" stroke="#00233a" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : current ? (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan flex-shrink-0" style={{ animation: 'processingPulse 0.9s ease-in-out infinite' }} />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 flex-shrink-0" />
              )}
              {step}
            </div>
          )
        })}
      </div>
    </div>
  )
}

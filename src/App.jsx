import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Music } from 'lucide-react'
import gsap from 'gsap'
import { cn } from './lib/utils'
import SectionHome from './components/SectionHome'
import SectionFeatures from './components/SectionFeatures'
import SectionInfo from './components/SectionInfo'
import trackSrc from './assets/track.mp3'

const NAV_ITEMS = [
  { id: 'home',     label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'info',     label: 'Info' },
]

const INFO_DWELL = 6000      // ms to sit on Info before looping
const RESUME_DELAY = 30000   // ms idle before autoplay resumes

// Global autoplay phase: home → features → info → (loop)
const PHASES = ['home', 'features', 'info']

export default function App() {
  const [autoplay, setAutoplay]           = useState(true)
  const [phase, setPhase]                 = useState('home')
  const [activeSection, setActiveSection] = useState('home')
  const [mutedTrack, setMutedTrack]       = useState(true)

  const resumeTimer  = useRef(null)
  const infoTimer    = useRef(null)
  const scrollingRef = useRef(false)
  const bgAudioRef   = useRef(null)

  const sectionRefs = {
    home:     useRef(null),
    features: useRef(null),
    info:     useRef(null),
  }

  // ── Programmatic section scroll ──────────────────────────────────────────
  const scrollTo = useCallback((id) => {
    scrollingRef.current = true
    sectionRefs[id]?.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => { scrollingRef.current = false }, 1000)
  }, [])

  // ── Observe active section for nav highlight ─────────────────────────────
  useEffect(() => {
    const observers = []
    Object.entries(sectionRefs).forEach(([id, ref]) => {
      if (!ref.current) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id) },
        { threshold: 0.5 }
      )
      obs.observe(ref.current)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // ── Audio: background track ───────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio(trackSrc)
    audio.loop = true
    audio.volume = 0
    bgAudioRef.current = audio
    return () => { audio.pause(); audio.src = '' }
  }, [])

  useEffect(() => {
    const audio = bgAudioRef.current
    if (!audio) return
    gsap.killTweensOf(audio)
    if (activeSection === 'home') {
      audio.play().catch(() => {})
      gsap.to(audio, { volume: mutedTrack ? 0 : 0.32, duration: 1.5, ease: 'power2.out' })
    } else {
      gsap.to(audio, {
        volume: 0, duration: 2.0, ease: 'power2.in',
        onComplete: () => { if (bgAudioRef.current?.volume < 0.01) bgAudioRef.current?.pause() },
      })
    }
  }, [activeSection, mutedTrack])

  const toggleMuteTrack = useCallback(() => setMutedTrack(m => !m), [])

  // ── Phase transitions ─────────────────────────────────────────────────────
  const advancePhase = useCallback(() => {
    setPhase(current => {
      const next = PHASES[(PHASES.indexOf(current) + 1) % PHASES.length]
      scrollTo(next)
      return next
    })
  }, [scrollTo])

  // Info dwell — after landing on info, auto-advance back to home
  useEffect(() => {
    if (!autoplay || phase !== 'info') {
      clearTimeout(infoTimer.current)
      return
    }
    infoTimer.current = setTimeout(advancePhase, INFO_DWELL)
    return () => clearTimeout(infoTimer.current)
  }, [autoplay, phase, advancePhase])

  // ── User interaction — pause autoplay, resume after idle ─────────────────
  const handleUserInteraction = useCallback(() => {
    if (!autoplay) return
    setAutoplay(false)
    clearTimeout(resumeTimer.current)
    resumeTimer.current = setTimeout(() => setAutoplay(true), RESUME_DELAY)
  }, [autoplay])

  const toggleAutoplay = () => {
    const next = !autoplay
    setAutoplay(next)
    clearTimeout(resumeTimer.current)
    if (next) scrollTo(phase)
  }

  // ── Section complete callbacks ────────────────────────────────────────────
  const handleHomeComplete = useCallback(() => {
    if (!autoplay) return
    setPhase('features')
    scrollTo('features')
  }, [autoplay, scrollTo])

  const handleFeaturesComplete = useCallback(() => {
    if (!autoplay) return
    setPhase('info')
    scrollTo('info')
  }, [autoplay, scrollTo])

  return (
    <div
      className="w-screen h-screen overflow-y-scroll overflow-x-hidden"
      style={{ scrollSnapType: 'y mandatory' }}
      onWheel={handleUserInteraction}
      onTouchMove={handleUserInteraction}
    >
      {/* ── Sections ─────────────────────────────────────────────────────── */}
      <div ref={sectionRefs.home} style={{ scrollSnapAlign: 'start' }}>
        <SectionHome
          autoplay={autoplay && phase === 'home'}
          active={activeSection === 'home'}
          onComplete={handleHomeComplete}
        />
      </div>

      <div ref={sectionRefs.features} style={{ scrollSnapAlign: 'start' }}>
        <SectionFeatures
          autoplay={autoplay && phase === 'features'}
          active={phase === 'features'}
          onComplete={handleFeaturesComplete}
          onUserInteract={handleUserInteraction}
        />
      </div>

      <div ref={sectionRefs.info} style={{ scrollSnapAlign: 'start' }}>
        <SectionInfo />
      </div>

      {/* ── Fixed Bottom Nav ─────────────────────────────────────────────── */}
      <BottomNav
        activeSection={activeSection}
        onNavClick={(id) => {
          handleUserInteraction()
          scrollTo(id)
          setPhase(id)
        }}
        autoplay={autoplay}
        onToggleAutoplay={toggleAutoplay}
        mutedTrack={mutedTrack}
        onToggleMuteTrack={toggleMuteTrack}
      />
    </div>
  )
}

function BottomNav({ activeSection, onNavClick, autoplay, onToggleAutoplay, mutedTrack, onToggleMuteTrack }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 flex items-center px-6 glass border-t border-white/30">
      {/* Wordmark */}
      <div className="select-none w-28">
        <span className="font-semibold text-sm tracking-tight">
          <span className="text-primary">Phase2</span>
          <span className="text-cyan">_Land</span>
        </span>
      </div>

      {/* Nav links — centered */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onNavClick(id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeSection === id
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:text-primary hover:bg-muted'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Controls — music + autoplay */}
      <div className="w-28 flex items-center justify-end gap-2">
        <button
          onClick={onToggleMuteTrack}
          title={mutedTrack ? 'Unmute music' : 'Mute music'}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full transition-all',
            'bg-muted text-muted-foreground hover:bg-border hover:text-primary',
            mutedTrack && 'opacity-40'
          )}
        >
          <Music size={13} />
        </button>
        <button
          onClick={onToggleAutoplay}
          title={autoplay ? 'Pause autoplay' : 'Start autoplay'}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-full transition-all',
            autoplay
              ? 'bg-primary text-white'
              : 'bg-muted text-muted-foreground hover:bg-border hover:text-primary'
          )}
        >
          {autoplay ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>
    </nav>
  )
}

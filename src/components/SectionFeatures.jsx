import { useState, useEffect, useRef } from 'react'
import { cn } from '../lib/utils'
import testDemo from '../assets/test-demo.mp4'

const FEATURES = [
  { id: 1, title: 'Map Capabilities',    description: 'Pan, zoom, and interact with every parcel. Spatial context for every deed in your database.',         video: testDemo },
  { id: 2, title: 'AI Q&A',              description: 'Ask natural-language questions about your right-of-way data. Get instant answers with source citations.', video: null },
  { id: 3, title: 'Deep Link to Source', description: 'Every answer and every boundary traces back to the exact deed page it came from.',                      video: null },
  { id: 4, title: 'Summary View',        description: 'High-level snapshot of any parcel — grantor, grantee, acreage, recording info — at a glance.',          video: null },
  { id: 5, title: 'Metadata View',       description: 'Full structured metadata extracted from each instrument, ready for export or further analysis.',         video: null },
  { id: 6, title: 'Metes & Bounds',      description: 'Legal descriptions parsed and displayed alongside the generated geometry.',                              video: null },
  { id: 7, title: 'Aliquot Support',     description: 'PLSS aliquot descriptions recognized and placed on the grid automatically.',                            video: null },
]

export default function SectionFeatures({ autoplay, active, onComplete, onUserInteract }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const videoRefs = useRef([])
  const timerRef  = useRef(null)

  // Reset to first feature when section becomes active
  useEffect(() => {
    if (active) setActiveIdx(0)
  }, [active])

  // Play/pause video when active feature changes
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return
      if (i === activeIdx) {
        vid.currentTime = 0
        vid.play().catch(() => {})
      } else {
        vid.pause()
      }
    })
  }, [activeIdx])

  // Auto-advance features when autoplay is on
  useEffect(() => {
    if (!autoplay) { clearTimeout(timerRef.current); return }

    const advance = () => {
      setActiveIdx(i => {
        const next = i + 1
        if (next >= FEATURES.length) {
          onComplete?.()
          return 0
        }
        return next
      })
    }

    const vid = videoRefs.current[activeIdx]
    if (vid && FEATURES[activeIdx].video) {
      vid.onended = advance
    } else {
      timerRef.current = setTimeout(advance, 4000)
    }
    return () => {
      clearTimeout(timerRef.current)
      if (vid) vid.onended = null
    }
  }, [autoplay, activeIdx])

  const handleFeatureClick = (i) => {
    setActiveIdx(i)
    onUserInteract?.()
  }

  return (
    <div className="w-screen h-screen pb-14 flex overflow-hidden bg-[#f0f4f8]">

      {/* Left — feature list */}
      <div className="w-80 flex-shrink-0 flex flex-col justify-center pl-10 pr-2 overflow-y-auto">
        <div className="space-y-1">
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              onClick={() => handleFeatureClick(i)}
              className={cn(
                'w-full text-left px-3 py-3 rounded-lg transition-all duration-200 group',
                activeIdx === i ? 'bg-white/70' : 'hover:bg-white/30'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all',
                  activeIdx === i ? 'bg-cyan scale-125' : 'bg-border group-hover:bg-muted-foreground'
                )} />
                <span className={cn(
                  'text-sm font-semibold transition-colors',
                  activeIdx === i ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                )}>
                  {f.title}
                </span>
              </div>
              {activeIdx === i && (
                <p className="mt-1.5 ml-4 text-xs text-muted-foreground leading-relaxed animate-fade-in-up">
                  {f.description}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right — video / placeholder */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {FEATURES.map((f, i) => (
          <div
            key={f.id}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
            style={{ opacity: activeIdx === i ? 1 : 0, pointerEvents: activeIdx === i ? 'auto' : 'none' }}
          >
            {f.video ? (
              <video
                ref={el => videoRefs.current[i] = el}
                src={f.video}
                className="rounded-xl shadow-lg block"
                style={{
                  maxWidth: 'calc(100% - 64px)',
                  maxHeight: 'calc(100% - 64px)',
                  width: 'auto',
                  height: 'auto',
                }}
                muted
                playsInline
                loop={!autoplay}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted/20">
                <div className="w-32 h-32 rounded-2xl bg-border/60 flex items-center justify-center">
                  <span className="text-4xl text-border">▶</span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground font-mono">
                    feature-{f.id}.mp4
                  </p>
                  <p className="text-xs text-border mt-1">Drop demo video here</p>
                </div>
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  )
}

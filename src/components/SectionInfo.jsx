import { ArrowUpRight } from 'lucide-react'
import logoDark from '../assets/logo_phase2_land_dark_bg.svg'
import logoWhite from '../assets/logo_phase2_land_white_bg.svg'

export default function SectionInfo() {
  return (
    <div className="w-screen h-screen pb-14 bg-primary text-white flex flex-col">

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-16">
        <div className="max-w-5xl w-full grid grid-cols-2 gap-20 items-start">

          {/* Left — product description */}
          <div>
            <div className="mb-6">
              <span className="text-sm font-semibold text-white/40 uppercase tracking-widest">About</span>
            </div>
            <img src={logoDark} alt="Phase2_Land" className="h-10 mb-6" draggable={false} />
            <p className="text-white/70 text-base leading-relaxed mb-4">
              Phase2_Land is an AI-powered solution that transforms deed documentation into structured,
              searchable spatial data — automatically. Upload scanned deeds and get a complete geodatabase,
              chain of title, and AI-powered search without manual data entry.
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              An offering of <span className="text-white font-semibold">Phase2</span>, a custom software
              and AI solutions firm building intelligent tools for government, infrastructure, and enterprise.
            </p>

            {/* Proof point */}
            <div className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan text-xs font-bold">OK</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">State of Oklahoma DOT</p>
                <p className="text-white/50 text-xs">Built for and deployed in production</p>
              </div>
            </div>
          </div>

          {/* Right — testimonial + CTA */}
          <div className="flex flex-col gap-8">

            {/* Testimonial */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-8 h-0.5 bg-cyan/50 mb-4" />
              <p className="text-white/80 text-sm leading-relaxed italic">
                "What other vendors told us couldn't be done, Phase2 had running in production.
                The accuracy, the speed — it changed how we think about what's possible with our deed records."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/60 text-xs font-semibold">K</span>
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold">Ken</p>
                  <p className="text-white/40 text-xs">Oklahoma DOT</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-5">
              <a
                href="https://phase2online.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-white text-primary font-semibold text-sm hover:bg-white/90 transition-colors group"
              >
                Visit Phase2
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              <div>
                <p className="text-white/30 text-[11px] uppercase tracking-widest mb-1.5">Get in touch</p>
                <a
                  href="mailto:land@phase2interactive.com"
                  className="text-white/60 text-sm hover:text-white transition-colors"
                >
                  land@phase2interactive.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wordmark */}
      <div className="px-16 pb-6 flex items-center justify-between">
        <img src={logoWhite} alt="Phase2_Land" className="h-5 opacity-40" draggable={false} />
        <span className="text-white/20 text-xs">
          AASHTO ROW · Cincinnati · 2025
        </span>
      </div>
    </div>
  )
}

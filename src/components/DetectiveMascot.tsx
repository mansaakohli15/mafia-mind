import { useEffect, useRef, useState } from "react";

/**
 * Inline-SVG detective silhouette whose pupils track the cursor.
 * Mouse-listener is throttled via rAF; no rerenders per mousemove —
 * we mutate the pupil <g> transform directly so the eyes feel buttery.
 */
export function DetectiveMascot({ className = "" }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<SVGGElement>(null);
  const rightPupilRef = useRef<SVGGElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const update = () => {
      raf = 0;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();

      // Eye centers in viewport space (matches SVG layout below)
      const eyes: Array<[SVGGElement | null, number, number]> = [
        [leftPupilRef.current, rect.left + rect.width * 0.39, rect.top + rect.height * 0.46],
        [rightPupilRef.current, rect.left + rect.width * 0.61, rect.top + rect.height * 0.46],
      ];

      for (const [el, cx, cy] of eyes) {
        if (!el) continue;
        const dx = lastX - cx;
        const dy = lastY - cy;
        const dist = Math.hypot(dx, dy);
        // Max pupil travel inside the eye-white (in SVG units)
        const maxR = 6;
        const nx = (dx / (dist || 1)) * Math.min(maxR, dist / 25);
        const ny = (dy / (dist || 1)) * Math.min(maxR, dist / 25);
        el.setAttribute("transform", `translate(${nx.toFixed(2)} ${ny.toFixed(2)})`);
      }
    };

    const onMove = (e: MouseEvent) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      aria-hidden="true"
      style={{ filter: mounted ? "drop-shadow(0 30px 40px rgba(0,0,0,0.6))" : undefined }}
    >
      <svg viewBox="0 0 200 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hat-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.18 0.02 45)" />
            <stop offset="1" stopColor="oklch(0.10 0.015 40)" />
          </linearGradient>
          <linearGradient id="face-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.78 0.08 65)" />
            <stop offset="1" stopColor="oklch(0.55 0.07 55)" />
          </linearGradient>
          <linearGradient id="coat-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.32 0.04 55)" />
            <stop offset="1" stopColor="oklch(0.18 0.03 50)" />
          </linearGradient>
          <radialGradient id="cheek-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="oklch(0.78 0.17 70 / 0.4)" />
            <stop offset="1" stopColor="oklch(0.78 0.17 70 / 0)" />
          </radialGradient>
        </defs>

        {/* warm rim light */}
        <ellipse cx="100" cy="120" rx="95" ry="115" fill="url(#cheek-glow)" />

        {/* coat / shoulders */}
        <path
          d="M 30 230 Q 30 170 70 160 L 130 160 Q 170 170 170 230 Z"
          fill="url(#coat-grad)"
        />
        {/* collar */}
        <path d="M 80 160 L 100 185 L 120 160 L 115 175 L 100 200 L 85 175 Z" fill="oklch(0.10 0.01 40)" />
        {/* tie */}
        <path d="M 96 185 L 104 185 L 108 215 L 100 230 L 92 215 Z" fill="oklch(0.50 0.20 27)" />

        {/* face */}
        <ellipse cx="100" cy="100" rx="55" ry="62" fill="url(#face-grad)" />
        {/* jaw shadow */}
        <path d="M 55 110 Q 100 175 145 110 Q 100 145 55 110 Z" fill="oklch(0.18 0.02 45 / 0.25)" />

        {/* hat brim */}
        <ellipse cx="100" cy="56" rx="78" ry="10" fill="url(#hat-grad)" />
        {/* hat crown */}
        <path
          d="M 50 56 Q 50 18 100 14 Q 150 18 150 56 Q 130 44 100 44 Q 70 44 50 56 Z"
          fill="url(#hat-grad)"
        />
        {/* hat band */}
        <rect x="50" y="48" width="100" height="8" fill="oklch(0.50 0.20 27 / 0.75)" />
        <rect x="50" y="48" width="100" height="2" fill="oklch(0.10 0.01 40)" />

        {/* eye whites */}
        <g>
          <ellipse cx="78" cy="110" rx="14" ry="10" fill="oklch(0.95 0.02 80)" />
          <ellipse cx="122" cy="110" rx="14" ry="10" fill="oklch(0.95 0.02 80)" />
        </g>

        {/* pupils — these get mutated by JS */}
        <g ref={leftPupilRef}>
          <circle cx="78" cy="110" r="5" fill="oklch(0.12 0.01 40)" />
          <circle cx="76.5" cy="108.5" r="1.4" fill="oklch(0.95 0.02 80)" />
        </g>
        <g ref={rightPupilRef}>
          <circle cx="122" cy="110" r="5" fill="oklch(0.12 0.01 40)" />
          <circle cx="120.5" cy="108.5" r="1.4" fill="oklch(0.95 0.02 80)" />
        </g>

        {/* brow — adds suspicion */}
        <path d="M 64 96 L 92 100" stroke="oklch(0.10 0.01 40)" strokeWidth="3" strokeLinecap="round" />
        <path d="M 108 100 L 136 96" stroke="oklch(0.10 0.01 40)" strokeWidth="3" strokeLinecap="round" />

        {/* nose hint */}
        <path d="M 100 118 Q 96 130 100 138 Q 104 130 100 118" fill="oklch(0.45 0.06 50 / 0.5)" />

        {/* mustache */}
        <path
          d="M 78 145 Q 90 142 100 148 Q 110 142 122 145 Q 118 154 100 152 Q 82 154 78 145 Z"
          fill="oklch(0.12 0.01 40)"
        />

        {/* pipe (peeking) */}
        <ellipse cx="138" cy="156" rx="8" ry="4" fill="oklch(0.30 0.05 50)" />
        <rect x="142" y="154" width="22" height="3" rx="1.5" fill="oklch(0.20 0.03 45)" />
        {/* smoke wisp */}
        <path
          d="M 145 152 Q 148 142 144 134 Q 150 128 146 118"
          stroke="oklch(0.92 0.028 80 / 0.35)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
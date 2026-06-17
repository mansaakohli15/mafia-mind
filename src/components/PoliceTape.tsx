/**
 * A diagonal "DO NOT CROSS" police-tape strip. Slightly tilted, casts
 * a soft shadow over whatever it sits in front of.
 */
export function PoliceTape({
  text = "DO NOT CROSS · CRIME SCENE · DO NOT CROSS · INVESTIGATION IN PROGRESS",
  className = "",
  rotate = -3,
}: {
  text?: string;
  className?: string;
  rotate?: number;
}) {
  return (
    <div
      className={`police-tape font-type text-xs sm:text-sm tracking-[0.3em] py-2 px-6 overflow-hidden whitespace-nowrap select-none shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <div className="flex gap-12 animate-[scroll-tape_30s_linear_infinite]">
        <span>{text}</span>
        <span>{text}</span>
        <span>{text}</span>
      </div>
      <style>{`@keyframes scroll-tape { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
    </div>
  );
}
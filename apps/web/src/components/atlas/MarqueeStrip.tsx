/**
 * Banda animada horizontal — diagonal infinita con texto repetido.
 * Decoración entre secciones, evoca carteles de gimnasio underground.
 */
export function MarqueeStrip({
  items,
  rotation = -2,
  bg = 'yellow',
}: {
  items: string[];
  rotation?: number;
  bg?: 'yellow' | 'black' | 'coral';
}) {
  const bgClass =
    bg === 'yellow'
      ? 'bg-atlas-yellow text-atlas-black'
      : bg === 'coral'
        ? 'bg-atlas-coral text-atlas-white'
        : 'bg-atlas-black text-atlas-yellow';

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className={`relative overflow-hidden border-y-2 border-atlas-black ${bgClass}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <div className="flex animate-[marquee_28s_linear_infinite] whitespace-nowrap py-4">
        {repeated.map((item, i) => (
          <span key={i} className="mx-8 inline-flex items-center font-display text-3xl uppercase">
            {item}
            <span className="ml-8 inline-block h-2 w-2 rotate-45 bg-current" />
          </span>
        ))}
      </div>
    </div>
  );
}

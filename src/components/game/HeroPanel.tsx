/** Home-screen intro: stylized Jenga tower with one block pulled out. */
function JengaStack() {
  const colors = ['#A78BFA', '#FFB454', '#F5F1F7', '#A78BFA', '#FFB454', '#F5F1F7']
  return (
    <svg
      aria-hidden
      viewBox="0 0 220 200"
      className="mx-auto h-44 w-auto animate-float drop-shadow-[0_20px_40px_rgba(244,90,167,0.25)]"
    >
      {colors.map((color, row) => {
        const y = 150 - row * 26
        return [0, 1, 2].map((col) => {
          const isPulled = row === 2 && col === 2
          return isPulled ? null : (
            <rect
              key={`${row}-${col}`}
              x={40 + col * 48 + (row % 2) * 4}
              y={y}
              width="44"
              height="22"
              rx="5"
              fill={color}
              opacity={0.92 - row * 0.06}
            />
          )
        })
      })}
      <rect x="150" y="96" width="62" height="22" rx="5" fill="#F45AA7" transform="rotate(16 181 107)" />
      <circle cx="196" cy="52" r="3" fill="#FFB454" />
      <circle cx="30" cy="70" r="2" fill="#F45AA7" />
      <circle cx="188" cy="168" r="2.5" fill="#A78BFA" />
    </svg>
  )
}

export function HeroPanel() {
  return (
    <section className="flex flex-col items-center gap-5 py-2 text-center">
      <JengaStack />
      <p className="max-w-xs text-lg text-balance text-mist">
        Pull a block. Pick your poison. Face the consequences. <span className="text-paper">Pass whenever.</span>
      </p>
    </section>
  )
}

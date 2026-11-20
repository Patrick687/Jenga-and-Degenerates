/** Game identity. Collapses to a single line once a prompt is on screen so the prompt owns the page. */
export function TitleBlock({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <h1 className="font-display text-2xl font-bold tracking-tight">
        29 <span className="text-hot">&amp;</span> UNHINGED
      </h1>
    )
  }

  return (
    <div>
      <h1 className="font-display text-[4.25rem] leading-[0.88] font-bold tracking-tighter sm:text-8xl">
        29 <span className="text-hot">&amp;</span>
        <br />
        UNHINGED
      </h1>
      <p className="mt-4 font-display text-lg font-medium text-mist">Truth. Dare. Chaos. Bad decisions.</p>
    </div>
  )
}

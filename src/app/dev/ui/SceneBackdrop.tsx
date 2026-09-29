export type BackdropKind = 'scene' | 'navy'

/**
 * Fundo das molduras de /dev/ui, no lugar do Canvas. `scene` imita o grey-box (paredes e piso
 * claros, móveis escuros, caixas coloridas): é o pior caso de legibilidade para o vidro.
 * `navy` é o vazio azul-marinho em volta da ilha.
 */
export function SceneBackdrop({ kind }: { kind: BackdropKind }) {
  if (kind === 'navy') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-bg-canvas">
        <div className="absolute -top-1/4 -left-1/6 size-[70%] rounded-full bg-accent-mint/25 blur-3xl" />
        <div className="absolute -right-1/6 -bottom-1/4 size-[70%] rounded-full bg-accent-blue/25 blur-3xl" />
      </div>
    )
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-bg-canvas">
      <div className="absolute inset-x-[6%] top-[4%] h-[62%] bg-[#e4ddd0]" />
      <div className="absolute top-[4%] bottom-[34%] left-0 w-[10%] bg-[#ece6db]" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#d9d0c1]" />
      <div className="absolute bottom-[34%] left-[12%] h-[16%] w-[34%] bg-[#2f3542]" />
      <div className="absolute bottom-[34%] left-[54%] h-[30%] w-[12%] bg-[#b08d6a]" />
      <div className="absolute bottom-[34%] left-[70%] h-[14%] w-[14%] bg-[#3f4652]" />
      <div className="absolute bottom-[48%] left-[74%] size-[6%] bg-[#ef6c3b]" />
      <div className="absolute right-[4%] bottom-[8%] h-[14%] w-[24%] bg-[#4f6aa3]" />
    </div>
  )
}

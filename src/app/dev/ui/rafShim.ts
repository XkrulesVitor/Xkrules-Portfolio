// Só em dev, e só com ?raf. Painéis de browser ocultos não disparam requestAnimationFrame, então o
// motion nunca avança (entradas, saídas e trocas de aba ficam pela metade). Com ?raf, o rAF passa a
// ser movido por setTimeout. Precisa ser o PRIMEIRO import do Preview: o motion captura o
// requestAnimationFrame global quando o módulo dele é avaliado.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('raf')) {
  const timers = new Map<number, ReturnType<typeof setTimeout>>()
  let nextHandle = 0
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const handle = ++nextHandle
    timers.set(
      handle,
      setTimeout(() => {
        timers.delete(handle)
        callback(performance.now())
      }, 16),
    )
    return handle
  }
  window.cancelAnimationFrame = (handle: number): void => {
    clearTimeout(timers.get(handle))
    timers.delete(handle)
  }
}

export {}

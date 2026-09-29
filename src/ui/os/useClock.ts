import { useSyncExternalStore } from 'react'
import { OS_TEXT } from '@/content/os'

const TIME_FORMAT = new Intl.DateTimeFormat(OS_TEXT.locale, { hour: '2-digit', minute: '2-digit' })
const DATE_FORMAT = new Intl.DateTimeFormat(OS_TEXT.locale, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function subscribe(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 5_000)
  return () => window.clearInterval(id)
}

const getTime = () => TIME_FORMAT.format(new Date())
const getDate = () => DATE_FORMAT.format(new Date())
// No servidor não há relógio "certo": devolve vazio e o cliente troca sem erro de hidratação.
const getServerValue = () => ''

/** Hora e data locais. Strings vazias até a hidratação. */
export function useClock(): { time: string; date: string } {
  const time = useSyncExternalStore(subscribe, getTime, getServerValue)
  const date = useSyncExternalStore(subscribe, getDate, getServerValue)
  return { time, date }
}

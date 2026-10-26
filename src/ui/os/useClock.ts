import { useSyncExternalStore } from 'react'
import { LOCALE_INFO, LOCALES, type Locale } from '@/content/i18n'
import { useLocale } from '../i18n/useLocale'

interface ClockFormats {
  time: Intl.DateTimeFormat
  date: Intl.DateTimeFormat
}

// Um par de formatadores por idioma (hora 24 h em pt-BR, 12 h em en-US), criados uma vez.
const FORMATS = Object.fromEntries(
  LOCALES.map((locale): [Locale, ClockFormats] => [
    locale,
    {
      time: new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, { hour: '2-digit', minute: '2-digit' }),
      date: new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    },
  ]),
) as Record<Locale, ClockFormats>

function subscribe(onChange: () => void): () => void {
  const id = window.setInterval(onChange, 5_000)
  return () => window.clearInterval(id)
}

// No servidor não há relógio "certo": devolve vazio e o cliente troca sem erro de hidratação.
const getServerValue = () => ''

/** Hora e data locais, no formato do idioma ativo. Strings vazias até a hidratação. */
export function useClock(): { time: string; date: string } {
  const formats = FORMATS[useLocale()]
  const time = useSyncExternalStore(subscribe, () => formats.time.format(new Date()), getServerValue)
  const date = useSyncExternalStore(subscribe, () => formats.date.format(new Date()), getServerValue)
  return { time, date }
}

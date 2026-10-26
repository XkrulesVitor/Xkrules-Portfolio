import { useEffect } from 'react'
import { LOCALE_INFO } from '@/content/i18n'
import { SITE_BY_LOCALE } from '@/content/site'
import { useLocale } from './useLocale'

/**
 * Leva o idioma ativo para o documento: `<html lang>` (leitores de tela e tradutores) e o título da
 * aba. Roda depois da hidratação (nunca durante), então não conflita com o HTML do servidor, que é em
 * português. Chamado pela tela de loading, o primeiro componente da página que existe no cliente.
 */
export function useDocumentLocale(): void {
  const locale = useLocale()

  useEffect(() => {
    document.documentElement.lang = LOCALE_INFO[locale].htmlLang
    document.title = SITE_BY_LOCALE[locale].title
  }, [locale])
}

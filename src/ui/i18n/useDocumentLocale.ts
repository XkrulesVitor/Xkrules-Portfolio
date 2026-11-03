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
    const title = SITE_BY_LOCALE[locale].title
    const apply = () => {
      if (document.title !== title) document.title = title
    }
    apply()
    // Em produção o Next grava o título do servidor depois da hidratação: reaplica quando o <head> muda.
    const observer = new MutationObserver(apply)
    observer.observe(document.head, { subtree: true, childList: true, characterData: true })
    return () => observer.disconnect()
  }, [locale])
}

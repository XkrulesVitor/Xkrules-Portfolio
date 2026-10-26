import { motion } from 'motion/react'
import { LOCALE_INFO, LOCALES } from '@/content/i18n'
import { useExperienceStore } from '@/store/useExperienceStore'
import { cx } from '../primitives/cx'
import { useLocale, useUiText } from '../i18n/useLocale'

/**
 * Seletor de idioma do HUD: controle segmentado compacto "PT | EN", no mesmo vidro das pílulas de som e
 * tema. Um grupo nomeado com um botão por idioma (`aria-pressed` marca o ativo): o nome acessível de cada
 * botão é o idioma escrito nele mesmo ("Português (PT)"), que contém o rótulo visível. Cada botão leva o
 * `lang` do próprio idioma, para o leitor de tela pronunciar certo.
 */
export function LanguageSwitch() {
  const locale = useLocale()
  const text = useUiText().hud.language

  return (
    <motion.div
      role="group"
      aria-label={text.label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-0.5 text-sm font-medium text-ink backdrop-blur-[var(--glass-blur)] select-none"
    >
      {LOCALES.map((code) => {
        const info = LOCALE_INFO[code]
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            lang={info.htmlLang}
            aria-label={`${info.name} (${info.label})`}
            aria-pressed={active}
            onClick={() => useExperienceStore.getState().setLocale(code)}
            className={cx(
              'cursor-pointer rounded-full px-3 py-2 text-xs font-semibold tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-mint',
              active
                ? 'bg-accent-mint/20 text-accent-mint'
                : 'text-ink/75 hover:bg-white/15 hover:text-ink',
            )}
          >
            {info.label}
          </button>
        )
      })}
    </motion.div>
  )
}

import { useRef, useState, type CSSProperties, type HTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { UI_TEXT } from '@/content/site'
import type { GamePlay, GameProject } from '@/content/types'
import { EASE, fmt, SmartImage } from '../primitives'

/**
 * Tamanho fixo do wrapper do jogo, em px CSS: a tela da TV mede 1.68 x 0.94 m (LAYOUT.tv), então
 * 1280 px de largura pedem 716 de altura. Quem prende o wrapper na TV 3D (TvGameHtml) calibra a escala
 * a partir destes números, como o MonitorHtml faz com o SO.
 */
export const TV_SCREEN_SIZE = { width: 1280, height: 716 } as const

/** Id do iframe: o botão "Tela cheia" da barra do overlay o procura por aqui. */
export const TV_GAME_FRAME_ID = 'tv-game-frame'

/** Permissões que o embed do itch.io dá aos jogos e que um jogo de navegador usa de fato. */
const FRAME_ALLOW = 'autoplay; fullscreen *; gamepad; accelerometer; gyroscope'

type TvPlay = Extract<GamePlay, { where: 'tv' }>

/**
 * O embed oficial do itch.io (upload_embed.css) põe o jogo num quadro com 1 px de borda e um rodapé de
 * 20 px. O jogo recebe uma área de 1280x720 por padrão, como no embed que o próprio itch gera: o motor
 * escala o jogo ali (640x360 em 2x, 1280x720 em 1x). Com menos de 720 px de altura, o zoom inteiro do
 * Construct 3 cai para 1x e o jogo fica pequeno no meio da TV. Jogos de canvas fixo trazem a própria
 * `area` (o Piter desenha num canvas de 1760x990). O iframe inteiro é reduzido por CSS até caber na TV.
 */
const DEFAULT_GAME_AREA = { width: 1280, height: 720 } as const
const EMBED_CHROME = { x: 2, y: 21 } as const

function frameStyle(play: TvPlay): CSSProperties {
  const area = play.area ?? DEFAULT_GAME_AREA
  const width = area.width + EMBED_CHROME.x
  const height = area.height + EMBED_CHROME.y
  const scale = Math.min(TV_SCREEN_SIZE.width / width, TV_SCREEN_SIZE.height / height)
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width,
    height,
    transform: `translate(-50%, -50%) scale(${scale})`,
  }
}

function TvGame({ game, play }: { game: GameProject; play: TvPlay }) {
  const t = UI_TEXT.tvGame
  const [loaded, setLoaded] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const accent = game.accent ?? 'var(--color-accent-mint)'

  return (
    <motion.div
      className="absolute inset-0 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      <iframe
        ref={frameRef}
        id={TV_GAME_FRAME_ID}
        src={play.src}
        title={fmt(t.frameTitle, { title: game.title })}
        allow={FRAME_ALLOW}
        allowFullScreen
        className="block border-0 bg-black"
        style={frameStyle(play)}
        onLoad={() => {
          setLoaded(true)
          // O teclado já vai para o jogo (o clique continua necessário para o áudio).
          frameRef.current?.focus()
        }}
      />
      <AnimatePresence>
        {loaded ? null : (
          <motion.div
            key="loading"
            className="absolute inset-0 grid place-items-center bg-[#05070d]"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${accent} 30%, transparent), transparent 62%)`,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="flex flex-col items-center gap-7 text-center">
              {game.cover ? (
                <div className="relative size-[260px] overflow-hidden rounded-3xl border border-white/20 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)]">
                  <SmartImage image={game.cover} sizes="260px" priority />
                </div>
              ) : null}
              <p className="flex items-center gap-3 text-[34px] font-semibold tracking-tight text-ink">
                {fmt(t.loading, { title: game.title })}
                <span aria-hidden="true" className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2.5 rounded-full bg-ink"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
              </p>
              <p className="max-w-[760px] text-[22px] leading-snug text-ink/70">{t.hint}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export interface TvGameScreenProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'> {
  /** Jogo ligado na TV (`store.playing`). `null`: o wrapper fica vazio e sem ponteiro. */
  game: GameProject | null
}

/**
 * Jogo rodando na TV do quarto (ARCHITECTURE §6.6): um wrapper FIXO de 1280x716 px com o iframe do
 * jogo (a versão web do itch.io) e, até o iframe carregar, uma tela "Ligando..." com a capa. Não
 * conhece o 3D: quem o embute (TvGameHtml) o põe sobre a tela da TV. Trocar de jogo remonta o iframe;
 * sem jogo, nada é montado e o jogo anterior para de vez (áudio incluído).
 */
export function TvGameScreen({ game, ...rest }: TvGameScreenProps) {
  const play = game?.play?.where === 'tv' ? game.play : null
  return (
    <div
      {...rest}
      className="relative overflow-hidden"
      style={{
        width: TV_SCREEN_SIZE.width,
        height: TV_SCREEN_SIZE.height,
        pointerEvents: play ? 'auto' : 'none',
      }}
    >
      {game && play ? <TvGame key={game.slug} game={game} play={play} /> : null}
    </div>
  )
}

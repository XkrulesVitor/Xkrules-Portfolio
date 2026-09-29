import Image from 'next/image'
import type { MediaImage } from '@/content/types'
import { cx } from './cx'

interface SmartImageProps {
  image: MediaImage
  /** Atributo `sizes` (largura renderizada), para o Next escolher o tamanho certo. */
  sizes: string
  priority?: boolean
  className?: string
}

/**
 * Imagem de conteúdo (`MediaImage`) que preenche o pai (que precisa ser `relative` e ter tamanho).
 * Caminhos de /public passam pelo otimizador do Next. URLs absolutas vão sem otimização, porque
 * `images.remotePatterns` não está configurado.
 */
export function SmartImage({ image, sizes, priority, className }: SmartImageProps) {
  const remote = /^https?:\/\//i.test(image.src)
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={remote}
      className={cx('object-cover', className)}
    />
  )
}

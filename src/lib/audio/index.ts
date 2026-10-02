// API pública do áudio sintetizado do quarto. `ui/**` e `experience/**` importam daqui.
export { audio } from './engine'
export type { AudioDebugState, AudioEngine } from './engine'
export { ambientLevel, fanLevel, staticLevel } from './mix'
export type { KeyVariant, MousePhase } from './voices'

// Registra o hook de resolução de módulos para rodar arquivos .ts de src/ direto no Node 24.
// Uso: node --import ./scripts/art/register.mjs scripts/art/export-layout.ts
import { register } from 'node:module'

register('./hooks.mjs', import.meta.url)

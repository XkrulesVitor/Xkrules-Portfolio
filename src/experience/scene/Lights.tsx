/**
 * PROVISÓRIO (grey-box): luz suave só para dar legibilidade às primitivas.
 * Sem sombras. Remover quando o bake chegar (BACKLOG 4.2).
 */
export function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#b7ab98', 1.25]} />
      <directionalLight position={[6, 10, 5]} intensity={1.4} />
    </>
  )
}

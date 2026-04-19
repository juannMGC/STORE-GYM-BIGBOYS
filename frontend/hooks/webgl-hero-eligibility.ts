/**
 * Decide si conviene montar WebGL (Three.js) o un hero estático ligero.
 * En móvil / datos limitados el GLB + bundle de Three bloquea CPU/GPU y la navegación.
 */
export function getWebglHeroEligible(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  /* Táctil en viewports típicos (hasta iPad Pro 12.9" en horizontal) — sin WebGL */
  if (window.matchMedia("(hover: none) and (max-width: 1366px)").matches) return false;

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;

  if (conn && "saveData" in conn && conn.saveData === true) return false;

  const et = conn?.effectiveType;
  if (et === "slow-2g" || et === "2g" || et === "3g") return false;

  return true;
}

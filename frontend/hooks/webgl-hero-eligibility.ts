/**
 * Política del hero 3D:
 * - static: sin WebGL (ahorro máximo de datos/GPU).
 * - lite: WebGL optimizado para móvil / 3g / CPUs modestos.
 * - full: escritorio / buena red.
 */

export type WebglHeroMode = "static" | "lite" | "full";

export function getWebglHeroMode(): WebglHeroMode {
  if (typeof window === "undefined") return "static";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;

  if (conn && "saveData" in conn && conn.saveData === true) return "static";

  const et = conn?.effectiveType;
  if (et === "slow-2g" || et === "2g") return "static";

  const liteNetwork = et === "3g";
  const liteTouch =
    window.matchMedia("(hover: none)").matches || window.matchMedia("(max-width: 900px)").matches;

  if (liteTouch || liteNetwork) return "lite";

  return "full";
}

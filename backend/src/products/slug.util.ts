/**
 * Genera un fragmento de URL seguro a partir del título.
 */
export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.length > 0 ? s : 'producto';
}

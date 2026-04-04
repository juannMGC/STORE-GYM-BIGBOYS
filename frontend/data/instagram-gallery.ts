/**
 * Galería tipo Instagram — una imagen a la vez en la home.
 *
 * Instagram no publica URLs de CDN en HTML estático; para usar fotos reales del perfil:
 * - Abrí un post en instagram.com (web), clic derecho en la imagen → “Abrir imagen en nueva pestaña” y copiá la URL, o
 * - Subí archivos a /public/instagram/ y usá src: "/instagram/foto1.jpg".
 *
 * Las URLs de abajo son referencia visual (gimnasio / fuerza); reemplazalas por las tuyas.
 */
export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/bigboys.gym/";

export type InstagramGalleryItem = {
  src: string;
  alt: string;
};

export const INSTAGRAM_GALLERY: InstagramGalleryItem[] = [
  {
    src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=85",
    alt: "Sala de pesas y equipamiento",
  },
  {
    src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=85",
    alt: "Entrenamiento con mancuernas",
  },
  {
    src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=85",
    alt: "Interior de gimnasio",
  },
  {
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=85",
    alt: "Zona de entrenamiento",
  },
  {
    src: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&q=85",
    alt: "Pesas y barra",
  },
  {
    src: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1200&q=85",
    alt: "Gimnasio con equipos",
  },
];

import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales de Big Boys Gym",
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "48px 24px",
      }}
    >
      <BackButton href="/" label="← Inicio" />

      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            color: "#d91920",
            fontSize: "12px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Legal
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 6vw, 48px)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "4px",
            margin: "0 0 16px",
          }}
        >
          Política de
          <span style={{ color: "#f7e047" }}> Privacidad</span>
        </h1>
        <p style={{ color: "#52525b", fontSize: "13px" }}>Última actualización: abril 2026</p>
        <div style={{ height: "3px", width: "60px", background: "#d91920", marginTop: "16px" }} />
      </div>

      <LegalSection numero="1" titulo="Responsable del tratamiento">
        Big Boys Gym es responsable del tratamiento de tus datos personales conforme a la Ley 1581 de 2012 (Ley de
        Protección de Datos Personales de Colombia) y el Decreto 1377 de 2013.
        <br />
        <br />
        Email: bigboysdevs@gmail.com
        <br />
        WhatsApp: +57 317 118 4925
        <br />
        Manizales, Caldas, Colombia
      </LegalSection>

      <LegalSection numero="2" titulo="Datos que recopilamos">
        Recopilamos la siguiente información cuando usás nuestra tienda:
        <br />
        <br />
        <strong style={{ color: "#e4e4e7" }}>Datos de cuenta:</strong>
        <br />
        • Nombre completo
        <br />
        • Dirección de email
        <br />
        • Foto de perfil (opcional)
        <br />
        • Teléfono (opcional)
        <br />
        <br />
        <strong style={{ color: "#e4e4e7" }}>Datos de envío:</strong>
        <br />
        • Dirección de entrega
        <br />
        • Ciudad y departamento
        <br />
        • Barrio y complemento
        <br />
        <br />
        <strong style={{ color: "#e4e4e7" }}>Datos de uso:</strong>
        <br />
        • Historial de pedidos
        <br />
        • Reseñas publicadas
        <br />• Preferencias de notificaciones
      </LegalSection>

      <LegalSection numero="3" titulo="Finalidad del tratamiento">
        Usamos tus datos para:
        <br />
        <br />
        • Procesar y entregar tus pedidos
        <br />
        • Enviarte confirmaciones y actualizaciones
        <br />
        • Mejorar tu experiencia de compra
        <br />
        • Enviarte ofertas (solo si diste tu consentimiento)
        <br />
        • Cumplir obligaciones legales
        <br />• Prevenir fraudes
      </LegalSection>

      <LegalSection numero="4" titulo="Base legal">
        El tratamiento de tus datos se basa en:
        <br />
        <br />
        • Tu consentimiento al registrarte
        <br />
        • La ejecución del contrato de compraventa
        <br />
        • Cumplimiento de obligaciones legales
        <br />• Nuestros intereses legítimos como empresa
      </LegalSection>

      <LegalSection numero="5" titulo="Compartición de datos">
        Compartimos tus datos únicamente con:
        <br />
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Auth0:</strong> gestión de autenticación
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Wompi:</strong> procesamiento de pagos
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Resend:</strong> envío de emails transaccionales
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Cloudinary:</strong> almacenamiento de imágenes
        <br />
        <br />
        No vendemos ni cedemos tus datos a terceros con fines comerciales.
      </LegalSection>

      <LegalSection numero="6" titulo="Tus derechos">
        Conforme a la Ley 1581 de 2012 tenés derecho a:
        <br />
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Conocer:</strong> saber qué datos tenemos sobre vos
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Actualizar:</strong> corregir datos inexactos
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Suprimir:</strong> solicitar la eliminación de tus datos
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Revocar:</strong> retirar tu consentimiento en cualquier momento
        <br />
        <br />
        Para ejercer estos derechos escribinos a bigboysdevs@gmail.com con el asunto &quot;Protección de datos&quot;.
      </LegalSection>

      <LegalSection numero="7" titulo="Cookies">
        Usamos cookies esenciales para el funcionamiento de la tienda (sesión, carrito) y cookies de Auth0 para la
        autenticación. No usamos cookies de rastreo publicitario de terceros.
      </LegalSection>

      <LegalSection numero="8" titulo="Seguridad">
        Implementamos medidas técnicas y organizativas para proteger tus datos:
        <br />
        <br />
        • Conexiones cifradas (HTTPS/TLS)
        <br />
        • Autenticación segura via Auth0
        <br />
        • Pagos procesados por Wompi (PCI DSS)
        <br />• Acceso restringido a datos sensibles
      </LegalSection>

      <LegalSection numero="9" titulo="Retención de datos">
        Conservamos tus datos mientras mantengas una cuenta activa o según lo requiera la ley. Al eliminar tu cuenta,
        borramos tus datos personales en un plazo máximo de 30 días, excepto los que debamos conservar por
        obligaciones legales (facturas, etc.).
      </LegalSection>

      <LegalSection numero="10" titulo="Cambios a esta política">
        Podemos actualizar esta política ocasionalmente. Te notificaremos por email ante cambios significativos. La
        fecha de última actualización aparece al inicio de esta página.
      </LegalSection>

      <div
        style={{
          marginTop: "48px",
          padding: "24px",
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderLeft: "3px solid #d91920",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display)",
            color: "#f7e047",
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          ¿Tenés preguntas?
        </p>
        <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
          Escribinos a{" "}
          <a href="mailto:bigboysdevs@gmail.com" style={{ color: "#f7e047" }}>
            bigboysdevs@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}

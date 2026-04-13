import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = {
  title: "Política de Devoluciones",
  description: "Política de devoluciones y cambios de Big Boys Gym · Manizales, Colombia",
  robots: { index: true, follow: true },
};

export default function DevolucionesPage() {
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
          Devoluciones
          <span style={{ color: "#f7e047" }}> y cambios</span>
        </h1>
        <p style={{ color: "#52525b", fontSize: "13px" }}>Última actualización: abril 2026</p>
        <div style={{ height: "3px", width: "60px", background: "#d91920", marginTop: "16px" }} />
      </div>

      <LegalSection numero="1" titulo="¿Cuándo podés devolver?">
        Podés solicitar una devolución dentro de los <strong style={{ color: "#e4e4e7" }}>15 días</strong> desde la
        recepción del producto, siempre que el artículo esté{" "}
        <strong style={{ color: "#e4e4e7" }}>sin uso</strong>, en perfecto estado y con su{" "}
        <strong style={{ color: "#e4e4e7" }}>embalaje original</strong> (incluyendo etiquetas y accesorios incluidos).
      </LegalSection>

      <LegalSection numero="2" titulo="¿Qué productos NO tienen devolución?">
        Por razones de higiene y seguridad, no aceptamos devoluciones de:
        <br />
        <br />
        • <strong style={{ color: "#e4e4e7" }}>Suplementos abiertos</strong> o con el precinto de seguridad roto
        <br />
        • Productos marcados como <strong style={{ color: "#e4e4e7" }}>oferta final</strong> o liquidación, cuando así
        se indique en la ficha del producto
        <br />• Artículos dañados por uso indebido o negligencia del cliente
      </LegalSection>

      <LegalSection numero="3" titulo="¿Cómo iniciar una devolución?">
        Escribinos por <strong style={{ color: "#e4e4e7" }}>WhatsApp +57 317 118 4925</strong> con:
        <br />
        <br />
        • Número de pedido o referencia
        <br />
        • Motivo de la devolución
        <br />
        • Fotos claras del producto y del embalaje
        <br />
        <br />
        Te indicamos los pasos para el envío o la devolución en punto de acuerdo según el caso.
      </LegalSection>

      <LegalSection numero="4" titulo="¿Cuánto tarda el reembolso?">
        Una vez que recibamos y verifiquemos el producto devuelto, el reembolso se procesa en un plazo aproximado de{" "}
        <strong style={{ color: "#e4e4e7" }}>5 a 10 días hábiles</strong>, según el método de pago original y la entidad
        financiera.
      </LegalSection>

      <LegalSection numero="5" titulo="Cambios de talla">
        Los cambios de talla están sujetos a <strong style={{ color: "#e4e4e7" }}>disponibilidad de stock</strong>. El
        cliente cubre el costo del envío del cambio salvo error atribuible a Big Boys Gym. Coordiná el cambio por el
        mismo canal de WhatsApp indicando pedido y talla deseada.
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
          Contacto devoluciones
        </p>
        <p style={{ color: "#a1a1aa", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
          WhatsApp:{" "}
          <a href="https://wa.me/573171184925" style={{ color: "#f7e047" }}>
            +57 317 118 4925
          </a>
          <br />
          Email:{" "}
          <a href="mailto:bigboysdevs@gmail.com" style={{ color: "#f7e047" }}>
            bigboysdevs@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}

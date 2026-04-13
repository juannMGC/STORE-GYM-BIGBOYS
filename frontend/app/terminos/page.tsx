import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso de la tienda Big Boys Gym",
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
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
          Términos y
          <span style={{ color: "#f7e047" }}> Condiciones</span>
        </h1>
        <p style={{ color: "#52525b", fontSize: "13px" }}>Última actualización: abril 2026</p>
        <div style={{ height: "3px", width: "60px", background: "#d91920", marginTop: "16px" }} />
      </div>

      <LegalSection numero="1" titulo="Aceptación de términos">
        Al acceder y usar la tienda online de Big Boys Gym (bigboysgym.com), aceptás estos términos y condiciones en su
        totalidad. Si no estás de acuerdo con alguna parte de estos términos, no deberás usar nuestros servicios.
      </LegalSection>

      <LegalSection numero="2" titulo="Descripción del servicio">
        Big Boys Gym opera una tienda online de suplementación deportiva e indumentaria ubicada en Manizales,
        Colombia. Ofrecemos productos de calidad para apoyar tu entrenamiento y estilo de vida activo.
        <br />
        <br />
        NIT: [NIT de la empresa]
        <br />
        Dirección: Manizales, Caldas, Colombia
        <br />
        Email: bigboysdevs@gmail.com
        <br />
        WhatsApp: +57 317 118 4925
      </LegalSection>

      <LegalSection numero="3" titulo="Registro y cuenta">
        Para realizar compras debés crear una cuenta con información veraz y actualizada. Sos responsable de mantener
        la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.
        <br />
        <br />
        Nos reservamos el derecho de suspender cuentas que violen estos términos o realicen actividades fraudulentas.
      </LegalSection>

      <LegalSection numero="4" titulo="Productos y precios">
        Los precios están expresados en pesos colombianos (COP) e incluyen IVA cuando aplica. Nos reservamos el
        derecho de modificar precios sin previo aviso.
        <br />
        <br />
        Las imágenes de los productos son ilustrativas. Pueden existir variaciones menores en color o presentación
        respecto al producto final.
      </LegalSection>

      <LegalSection numero="5" titulo="Proceso de compra">
        Al confirmar tu pedido y realizar el pago, estás haciendo una oferta de compra. El contrato se formaliza cuando
        confirmamos tu pedido por email.
        <br />
        <br />
        Los pagos se procesan de forma segura a través de Wompi (Bancolombia). No almacenamos datos de tarjetas de
        crédito.
      </LegalSection>

      <LegalSection numero="6" titulo="Envíos y entregas">
        Realizamos envíos a toda Colombia. Los tiempos de entrega varían según la ubicación:
        <br />
        <br />
        • Manizales: 1-2 días hábiles
        <br />
        • Otras ciudades principales: 3-5 días hábiles
        <br />
        • Zonas rurales: 5-10 días hábiles
        <br />
        <br />
        Los costos de envío se calculan al momento del checkout según el destino y el peso del pedido.
      </LegalSection>

      <LegalSection numero="7" titulo="Devoluciones y cambios">
        Aceptamos devoluciones dentro de los 15 días calendario siguientes a la recepción del producto, siempre que:
        <br />
        <br />
        • El producto esté en perfectas condiciones
        <br />
        • No haya sido usado ni abierto
        <br />
        • Conserve el embalaje original
        <br />
        <br />
        Para iniciar una devolución contactanos por WhatsApp: +57 317 118 4925
      </LegalSection>

      <LegalSection numero="8" titulo="Propiedad intelectual">
        Todo el contenido de este sitio (imágenes, textos, logos, diseños) es propiedad de Big Boys Gym y está
        protegido por las leyes de propiedad intelectual colombianas. Está prohibida su reproducción sin autorización
        expresa.
      </LegalSection>

      <LegalSection numero="9" titulo="Limitación de responsabilidad">
        Big Boys Gym no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de
        nuestros productos o servicios, más allá de lo establecido por la ley colombiana de protección al consumidor.
      </LegalSection>

      <LegalSection numero="10" titulo="Ley aplicable">
        Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se resolverá ante los
        tribunales competentes de Manizales, Caldas.
        <br />
        <br />
        Ley 1480 de 2011 (Estatuto del Consumidor colombiano) aplica a todas nuestras transacciones.
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
          </a>{" "}
          o por WhatsApp al{" "}
          <a href="https://wa.me/573171184925" style={{ color: "#f7e047" }}>
            +57 317 118 4925
          </a>
        </p>
      </div>
    </main>
  );
}

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

/** Datos alineados a GET /orders/:id/detail */
export type FacturaOrderPdf = {
  id: string;
  status: string;
  createdAt: string;
  paymentMethod: string | null;
  shippingEmail: string | null;
  shippingDepartment: string | null;
  shippingCity: string | null;
  shippingNeighborhood: string | null;
  shippingAddress: string | null;
  shippingComplement: string | null;
  user: { name: string | null; email: string };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string };
    size: { name: string } | null;
  }>;
  total?: number;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: 40,
    paddingBottom: 72,
    fontFamily: "Helvetica",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: "3px solid #d91920",
  },
  headerLeft: {
    flex: 1,
  },
  brandName: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#d91920",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  brandSub: {
    fontSize: 10,
    color: "#71717a",
    marginTop: 4,
    letterSpacing: 2,
  },
  facturaLabel: {
    fontSize: 10,
    color: "#71717a",
    letterSpacing: 3,
    textTransform: "uppercase",
    textAlign: "right",
  },
  facturaNumero: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#111111",
    textAlign: "right",
    marginTop: 4,
    letterSpacing: 2,
  },

  infoSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 28,
    gap: 12,
  },
  infoBox: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 140,
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#71717a",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    fontSize: 11,
    color: "#111111",
    lineHeight: 1.5,
  },
  estadoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#d91920",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  estadoText: {
    fontSize: 9,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#111111",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 9,
    color: "#f7e047",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottom: "1px solid #e5e5e5",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colProducto: { flex: 3 },
  colTalla: { flex: 1, textAlign: "center" },
  colCantidad: { flex: 1, textAlign: "center" },
  colPrecio: { flex: 1.5, textAlign: "right" },
  colSubtotal: { flex: 1.5, textAlign: "right" },
  cellText: {
    fontSize: 10,
    color: "#333333",
  },
  cellTextBold: {
    fontSize: 10,
    color: "#111111",
    fontFamily: "Helvetica-Bold",
  },

  totalesSection: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 6,
    borderBottom: "1px solid #e5e5e5",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 10,
    backgroundColor: "#111111",
    paddingHorizontal: 14,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#71717a",
  },
  totalValue: {
    fontSize: 10,
    color: "#111111",
    fontFamily: "Helvetica-Bold",
  },
  totalLabelFinal: {
    fontSize: 12,
    color: "#f7e047",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  totalValueFinal: {
    fontSize: 14,
    color: "#f7e047",
    fontFamily: "Helvetica-Bold",
  },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e5e5",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#a1a1aa",
    letterSpacing: 1,
  },
  footerBrand: {
    fontSize: 9,
    color: "#d91920",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },

  notaPago: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#fff7ed",
    borderLeft: "3px solid #f97316",
  },
  notaPagoLabel: {
    fontSize: 8,
    color: "#c2410c",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  notaPagoText: {
    fontSize: 10,
    color: "#7c2d12",
    lineHeight: 1.5,
  },
});

const formatCOP = (valor: number) => `$${valor.toLocaleString("es-CO")}`;

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente",
  PAID: "Confirmado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const paymentLabels: Record<string, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia bancaria",
  CARD: "Tarjeta",
};

function calcularTotal(
  items: FacturaOrderPdf["items"],
  fallbackTotal?: number,
): number {
  if (typeof fallbackTotal === "number" && Number.isFinite(fallbackTotal)) {
    return fallbackTotal;
  }
  return (
    items?.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    ) ?? 0
  );
}

export function FacturaPDF({ order }: { order: FacturaOrderPdf }) {
  const total = calcularTotal(order.items, order.total);

  return (
    <Document
      title={`Factura-BigBoysGym-${order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`}
      author="Big Boys Gym"
      subject="Factura de compra"
      creator="Big Boys Gym · Tienda Oficial"
    >
      <Page size="A4" style={styles.page}>
        <View wrap>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.brandName}>BIG BOYS GYM</Text>
              <Text style={styles.brandSub}>
                TIENDA OFICIAL · MANIZALES, COLOMBIA
              </Text>
            </View>
            <View>
              <Text style={styles.facturaLabel}>FACTURA</Text>
              <Text style={styles.facturaNumero}>
                #{order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Fecha del pedido</Text>
              <Text style={styles.infoValue}>{formatFecha(order.createdAt)}</Text>
              <View style={styles.estadoBadge}>
                <Text style={styles.estadoText}>
                  {statusLabels[order.status] ?? order.status}
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>
                {order.user?.name ?? "Cliente"}
              </Text>
              <Text
                style={[styles.infoValue, { color: "#71717a", fontSize: 10 }]}
              >
                {order.user?.email ?? "—"}
              </Text>
              {order.shippingEmail &&
                order.shippingEmail !== order.user?.email && (
                  <Text
                    style={[styles.infoValue, { color: "#71717a", fontSize: 10 }]}
                  >
                    Envío: {order.shippingEmail}
                  </Text>
                )}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Envío a</Text>
              {order.shippingAddress ? (
                <>
                  <Text style={styles.infoValue}>
                    {order.shippingAddress}
                    {order.shippingComplement
                      ? `, ${order.shippingComplement}`
                      : ""}
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: "#71717a", fontSize: 10 }]}
                  >
                    {order.shippingNeighborhood
                      ? `${order.shippingNeighborhood} · `
                      : ""}
                    {order.shippingCity ?? ""}
                    {order.shippingDepartment
                      ? `, ${order.shippingDepartment}`
                      : ""}
                  </Text>
                </>
              ) : (
                <Text style={[styles.infoValue, { color: "#71717a" }]}>
                  Por coordinar
                </Text>
              )}
              <Text
                style={[
                  styles.infoValue,
                  { color: "#71717a", fontSize: 10, marginTop: 4 },
                ]}
              >
                Pago:{" "}
                {order.paymentMethod
                  ? (paymentLabels[order.paymentMethod] ?? order.paymentMethod)
                  : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProducto]}>
              Producto
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTalla]}>Talla</Text>
            <Text style={[styles.tableHeaderText, styles.colCantidad]}>
              Cant.
            </Text>
            <Text style={[styles.tableHeaderText, styles.colPrecio]}>
              P. Unit.
            </Text>
            <Text style={[styles.tableHeaderText, styles.colSubtotal]}>
              Subtotal
            </Text>
          </View>

          {order.items?.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <View style={styles.colProducto}>
                <Text style={styles.cellTextBold}>
                  {item.product?.name ?? "Producto"}
                </Text>
              </View>
              <Text style={[styles.cellText, styles.colTalla]}>
                {item.size?.name ?? "—"}
              </Text>
              <Text style={[styles.cellText, styles.colCantidad]}>
                {item.quantity}
              </Text>
              <Text style={[styles.cellText, styles.colPrecio]}>
                {formatCOP(item.unitPrice)}
              </Text>
              <Text style={[styles.cellTextBold, styles.colSubtotal]}>
                {formatCOP(item.unitPrice * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.totalesSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCOP(total)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Envío</Text>
              <Text style={styles.totalValue}>Por coordinar</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL</Text>
              <Text style={styles.totalValueFinal}>{formatCOP(total)}</Text>
            </View>
          </View>

          {(order.paymentMethod === "CASH" ||
            order.paymentMethod === "BANK_TRANSFER") && (
            <View style={styles.notaPago}>
              <Text style={styles.notaPagoLabel}>Instrucciones de pago</Text>
              <Text style={styles.notaPagoText}>
                {order.paymentMethod === "CASH"
                  ? "El pago se realiza en efectivo al momento de la entrega. El pedido se confirmará una vez coordinada la entrega."
                  : "Realizá la transferencia y enviá el comprobante para confirmar tu pedido. Nos contactaremos pronto con los datos de la cuenta."}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerBrand}>BIG BOYS GYM</Text>
            <Text style={styles.footerText}>
              Tienda oficial · Manizales, Colombia
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.footerText}>
              Generado el {formatFecha(new Date().toISOString())}
            </Text>
            <Text style={styles.footerText}>
              Pedido #
              {order.id.replace(/-/g, "").slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

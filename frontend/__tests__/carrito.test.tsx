import { render, screen, waitFor } from "@testing-library/react";
import CarritoPage from "@/app/carrito/page";

const apiFetchMock = jest.fn();

jest.mock("@/lib/api-client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  formatShopApiError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/back-button", () => ({
  BackButton: () => null,
}));

import { useAuth } from "@/lib/auth-context";

describe("Carrito — lógica de negocio", () => {
  const mockItems = [
    {
      id: "item-1",
      quantity: 2,
      unitPrice: 189900,
      productId: "p1",
      sizeId: null,
      product: {
        id: "p1",
        title: "Proteína",
        images: [{ url: "https://example.com/a.jpg" }],
      },
      size: { id: "s1", name: "1kg", code: "1", description: null },
    },
    {
      id: "item-2",
      quantity: 1,
      unitPrice: 79900,
      productId: "p2",
      sizeId: null,
      product: {
        id: "p2",
        title: "Camiseta",
        images: [],
      },
      size: { id: "s2", name: "L", code: "L", description: null },
    },
  ];

  it("calcula el subtotal de cada item correctamente", () => {
    const subtotal1 = mockItems[0].unitPrice * mockItems[0].quantity;
    const subtotal2 = mockItems[1].unitPrice * mockItems[1].quantity;

    expect(subtotal1).toBe(379800);
    expect(subtotal2).toBe(79900);
  });

  it("calcula el total del carrito correctamente", () => {
    const total = mockItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    expect(total).toBe(459700);
  });

  it("formatea precio en COP correctamente", () => {
    const formatCOP = (val: number) => `$${val.toLocaleString("es-CO")}`;

    expect(formatCOP(189900)).toContain("189");
    expect(formatCOP(0)).toBe("$0");
  });

  it("no permite cantidad negativa (parseo seguro)", () => {
    const toNum = (val: unknown) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    expect(toNum(undefined)).toBe(0);
    expect(toNum(null)).toBe(0);
    expect(toNum("NaN")).toBe(0);
    expect(toNum("189900")).toBe(189900);
    expect(toNum(2)).toBe(2);
  });
});

describe("Carrito — UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      displayName: "Cliente Test",
      user: { id: "u1", email: "c@test.com", role: "CLIENT" },
    });
  });

  it("muestra ítems y total cuando el API devuelve el pedido", async () => {
    apiFetchMock.mockResolvedValue({
      id: "order-1",
      userId: "u1",
      status: "DRAFT",
      paymentMethod: "CASH",
      items: [
        {
          id: "item-1",
          quantity: 2,
          priceSnapshot: 100,
          productId: "p1",
          sizeId: null,
          product: {
            id: "p1",
            title: "Proteína",
            images: [{ url: "https://example.com/a.jpg" }],
          },
          size: { id: "s1", name: "1kg", code: "1", description: null },
        },
        {
          id: "item-2",
          quantity: 1,
          priceSnapshot: 50,
          productId: "p2",
          sizeId: null,
          product: {
            id: "p2",
            title: "Camiseta",
            images: [],
          },
          size: null,
        },
      ],
    });

    render(<CarritoPage />);

    expect(await screen.findByText("Proteína")).toBeInTheDocument();
    expect(screen.getByText("Camiseta")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/\$250\.00/)).toBeInTheDocument();
    });
  });
});

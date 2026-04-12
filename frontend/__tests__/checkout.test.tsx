import { render, screen, waitFor } from "@testing-library/react";
import CheckoutPage from "@/app/checkout/page";

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

describe("Checkout — prefill desde perfil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      displayName: "Cliente",
      user: {
        id: "u1",
        email: "perfil@test.com",
        role: "CLIENT",
        department: "Cundinamarca",
        city: "Bogotá",
        neighborhood: "Chapinero",
        address: "Calle 10 #20",
        complement: "Apto 3",
      },
      refreshUser: jest.fn(),
    });
  });

  it("pre-llena envío con datos del perfil cuando el pedido no los tiene", async () => {
    apiFetchMock.mockResolvedValue({
      id: "order-1",
      userId: "u1",
      status: "DRAFT",
      paymentMethod: "BANK_TRANSFER",
      shippingEmail: null,
      shippingDepartment: null,
      shippingCity: null,
      shippingNeighborhood: null,
      shippingAddress: null,
      shippingComplement: null,
      items: [
        {
          id: "i1",
          quantity: 1,
          priceSnapshot: 100,
          productId: "p1",
          sizeId: null,
          product: {
            id: "p1",
            title: "Item",
            images: [],
          },
          size: null,
        },
      ],
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("perfil@test.com")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Cundinamarca")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bogotá")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chapinero")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Calle 10 #20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Apto 3")).toBeInTheDocument();
  });
});

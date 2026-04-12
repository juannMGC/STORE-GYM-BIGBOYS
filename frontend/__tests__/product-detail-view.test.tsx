import { render, screen, waitFor } from "@testing-library/react";
import { ProductDetailView } from "@/components/product-detail-view";

const apiFetchMock = jest.fn();

jest.mock("@/lib/api-client", () => ({
  __esModule: true,
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  },
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  formatShopApiError: (e: unknown) => (e instanceof Error ? e.message : String(e)),
  isSessionExpiredError: () => false,
}));

jest.mock("@/lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "@/lib/auth-context";

const baseProduct = {
  id: "prod-1",
  title: "Proteína Premium BIG BOIS",
  slug: "proteina-premium",
  price: 189900,
  stock: 10,
  description: "La mejor proteína",
  categoryId: "cat-1",
  createdAt: new Date().toISOString(),
  category: { id: "c1", name: "Suplementación", slug: "suplementacion" },
  images: [{ id: "im1", url: "https://cloudinary.com/img.jpg", sortOrder: 0 }],
  sizes: [
    { size: { id: "size-1", name: "1kg", code: "1KG", description: null } },
    { size: { id: "size-2", name: "2kg", code: "2KG", description: null } },
  ],
};

describe("ProductDetailView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      user: { role: "CLIENT" },
    });
  });

  it("muestra el nombre del producto", async () => {
    apiFetchMock.mockResolvedValueOnce(baseProduct);

    render(<ProductDetailView apiPath="/products/by-slug/proteina-premium" />);

    expect(
      await screen.findByRole("heading", { level: 1, name: /Proteína Premium BIG BOIS/i }),
    ).toBeInTheDocument();
  });

  it("muestra el precio formateado en COP", async () => {
    apiFetchMock.mockResolvedValueOnce(baseProduct);

    render(<ProductDetailView apiPath="/p" />);

    expect(await screen.findByText(/189/)).toBeInTheDocument();
  });

  it('habilita "Añadir al carrito" cuando hay stock y talla elegida', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ...baseProduct,
      sizes: [{ size: { id: "only", name: "Única", code: "U", description: null } }],
    });

    render(<ProductDetailView apiPath="/p" />);

    const boton = await screen.findByRole("button", { name: /añadir al carrito/i });
    await waitFor(() => expect(boton).not.toBeDisabled());
  });

  it('muestra "Agotado" deshabilitado cuando stock=0', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ...baseProduct,
      stock: 0,
      sizes: [{ size: { id: "only", name: "Única", code: "U", description: null } }],
    });

    render(<ProductDetailView apiPath="/p" />);

    const boton = await screen.findByRole("button", { name: /agotado/i });
    expect(boton).toBeDisabled();
  });

  it('muestra aviso "Solo quedan X" cuando stock ≤ 10 y > 0', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ...baseProduct,
      stock: 3,
      sizes: [{ size: { id: "only", name: "Única", code: "U", description: null } }],
    });

    render(<ProductDetailView apiPath="/p" />);

    expect(await screen.findByText(/Solo quedan 3 unidades/i)).toBeInTheDocument();
  });

  it("muestra enlace de login cuando no está logueado", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoggedIn: false,
      isLoading: false,
      user: null,
    });
    apiFetchMock.mockResolvedValueOnce({
      ...baseProduct,
      sizes: [{ size: { id: "only", name: "Única", code: "U", description: null } }],
    });

    render(<ProductDetailView apiPath="/p" />);

    expect(await screen.findByText(/Iniciá sesión para comprar/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /iniciá sesión/i })).toBeInTheDocument();
  });

  it("muestra Cargando en botón cuando auth está cargando", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      isLoggedIn: false,
      isLoading: true,
      user: null,
    });
    apiFetchMock.mockResolvedValueOnce({
      ...baseProduct,
      stock: 0,
      sizes: [{ size: { id: "only", name: "Única", code: "U", description: null } }],
    });

    render(<ProductDetailView apiPath="/p" />);

    expect(await screen.findByRole("button", { name: /^Cargando…$/i })).toBeInTheDocument();
  });

  it("lista tallas en el select", async () => {
    apiFetchMock.mockResolvedValueOnce(baseProduct);

    render(<ProductDetailView apiPath="/p" />);

    expect(await screen.findByRole("option", { name: /1kg/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /2kg/i })).toBeInTheDocument();
  });
});

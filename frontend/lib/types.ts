export type UserRole = "CLIENT" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string | null;
  phone?: string | null;
  department?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  complement?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string | null;
  description?: string | null;
  imageUrl?: string | null;
  parentId: string | null;
  createdAt: string;
};

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};

export type Size = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
};

export type ProductListItem = {
  id: string;
  title: string;
  /** Para URLs /tienda/productos/:slug */
  slug: string | null;
  description: string | null;
  price: number;
  /** Presente desde migración `product_stock`; fallback en UI si falta. */
  stock?: number;
  categoryId: string;
  createdAt: string;
  category: { id: string; name: string; slug: string | null };
  images: { id: string; url: string; sortOrder: number }[];
  sizes: { size: Size }[];
};

export type ProductDetail = ProductListItem & {
  images: { id: string; url: string; sortOrder: number }[];
  sizes: { size: Size }[];
};

export type CartOrder = {
  id: string;
  userId: string;
  status: string;
  paymentMethod: string | null;
  shippingEmail?: string | null;
  shippingDepartment?: string | null;
  shippingCity?: string | null;
  shippingNeighborhood?: string | null;
  shippingAddress?: string | null;
  shippingComplement?: string | null;
  items: {
    id: string;
    quantity: number;
    priceSnapshot: number;
    productId: string;
    sizeId: string | null;
    product: {
      id: string;
      title: string;
      images: { url: string }[];
    };
    size: Size | null;
  }[];
};

/** GET /orders/cart cuando no hay borrador DRAFT (no se crea pedido vacío). */
export type EmptyCartResponse = { items: []; total: 0 };

export type CartGetResponse = CartOrder | EmptyCartResponse;

export function isCartOrderPayload(r: CartGetResponse): r is CartOrder {
  return typeof r === "object" && r !== null && "id" in r;
}

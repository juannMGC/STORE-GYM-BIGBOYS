export type UserRole = "CLIENT" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string | null;
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
};

export type ProductListItem = {
  id: string;
  title: string;
  /** Para URLs /tienda/productos/:slug */
  slug: string | null;
  description: string | null;
  price: number;
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

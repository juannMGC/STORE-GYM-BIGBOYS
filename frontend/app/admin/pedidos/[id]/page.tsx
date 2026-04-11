import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPedidoLegacyRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/pedidos?order=${encodeURIComponent(id)}`);
}

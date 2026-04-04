import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Panel administrador</h1>
      <p className="mt-2 text-zinc-600">
        Gestioná pedidos desde aquí. El alta de categorías, tallas y productos puede
        hacerse vía API (Postman, etc.) hasta que se añadan formularios en esta UI.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/admin/pedidos"
            className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-amber-400"
          >
            <span className="font-semibold text-zinc-900">Pedidos</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Listar y cambiar estado (pagado, enviado, cancelado)
            </span>
          </Link>
        </li>
        <li className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-zinc-500">
          <span className="font-medium">Catálogo</span>
          <span className="mt-1 block text-sm">
            Endpoints: <code className="text-xs">/api/admin/categories</code>,{" "}
            <code className="text-xs">/api/admin/sizes</code>,{" "}
            <code className="text-xs">/api/admin/products</code>
          </span>
        </li>
      </ul>
    </div>
  );
}

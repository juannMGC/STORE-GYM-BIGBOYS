import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">
        Panel administrador
      </h1>
      <p className="mt-2 text-zinc-400">
        Gestioná pedidos desde aquí. El alta de categorías, tallas y productos puede
        hacerse vía API (Postman, etc.) hasta que se añadan formularios en esta UI.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/admin/pedidos"
            className="panel-brand block p-6 transition hover:border-brand-red"
          >
            <span className="font-display text-xl uppercase text-white">Pedidos</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Listar y cambiar estado (pagado, enviado, cancelado)
            </span>
          </Link>
        </li>
        <li className="panel-brand border-dashed p-6 text-zinc-500">
          <span className="font-medium text-zinc-300">Catálogo</span>
          <span className="mt-1 block text-sm">
            Endpoints: <code className="text-xs text-brand-yellow">/api/admin/categories</code>,{" "}
            <code className="text-xs text-brand-yellow">/api/admin/sizes</code>,{" "}
            <code className="text-xs text-brand-yellow">/api/admin/products</code>
          </span>
        </li>
      </ul>
    </div>
  );
}

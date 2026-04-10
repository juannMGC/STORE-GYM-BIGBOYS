import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">
        Panel administrador
      </h1>
      <p className="mt-2 text-zinc-400">
        Gestioná pedidos, categorías, tallas y productos desde este panel.
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
        <li>
          <Link
            href="/admin/categorias"
            className="panel-brand block p-6 transition hover:border-brand-red"
          >
            <span className="font-display text-xl uppercase text-white">Categorías</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Alta, edición y baja (árbol con padre opcional)
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/tallas"
            className="panel-brand block p-6 transition hover:border-brand-red"
          >
            <span className="font-display text-xl uppercase text-white">Tallas</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Nombre y código único (S, XL, 250g…)
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/productos"
            className="panel-brand block p-6 transition hover:border-brand-red"
          >
            <span className="font-display text-xl uppercase text-white">Productos</span>
            <span className="mt-1 block text-sm text-zinc-500">
              Catálogo, imágenes, tallas y stock
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

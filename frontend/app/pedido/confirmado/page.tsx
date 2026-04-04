import Link from "next/link";

export default function PedidoConfirmadoPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">
        ¡Pedido registrado!
      </h1>
      <p className="mt-4 text-zinc-400">
        Tu compra quedó en estado pendiente. El administrador confirmará el pago
        y el envío según el proceso interno.
      </p>
      <Link href="/tienda" className="btn-brand mt-8 inline-flex">
        Seguir comprando
      </Link>
    </div>
  );
}

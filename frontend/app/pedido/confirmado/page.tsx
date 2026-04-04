import Link from "next/link";

export default function PedidoConfirmadoPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-zinc-900">¡Pedido registrado!</h1>
      <p className="mt-4 text-zinc-600">
        Tu compra quedó en estado pendiente. El administrador confirmará el pago
        y el envío según el proceso interno.
      </p>
      <Link
        href="/tienda"
        className="mt-8 inline-block rounded-lg bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800"
      >
        Seguir comprando
      </Link>
    </div>
  );
}

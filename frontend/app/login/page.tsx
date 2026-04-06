import { redirect } from "next/navigation";
import { loginPath } from "@/lib/auth-routes";

/** `/login` redirige a la ruta con slug por defecto (p. ej. `/login/entrar`). */
export default function LoginIndexPage() {
  redirect(loginPath());
}

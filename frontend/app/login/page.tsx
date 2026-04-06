import { redirect } from "next/navigation";
import { LOGIN_ENTRY_HREF } from "@/lib/auth-routes";

/** `/login` → `/login/entrar` */
export default function LoginIndexPage() {
  redirect(LOGIN_ENTRY_HREF);
}

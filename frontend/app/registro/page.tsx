import { redirect } from "next/navigation";
import { registroPath } from "@/lib/auth-routes";

/** `/registro` redirige a `/registrar/cuenta` (slug por defecto). */
export default function RegistroLegacyPage() {
  redirect(registroPath());
}

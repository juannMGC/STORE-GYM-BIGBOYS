import { redirect } from "next/navigation";
import { registroPath } from "@/lib/auth-routes";

/** `/registrar` → `/registrar/cuenta` */
export default function RegistrarIndexPage() {
  redirect(registroPath());
}

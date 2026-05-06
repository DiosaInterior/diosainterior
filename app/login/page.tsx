import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { getUser } from "@/lib/auth/server";

export const metadata = {
  title: "Entrar — Diosa Interior",
};

export default async function LoginPage() {
  const user = await getUser();
  if (user) {
    redirect("/upload");
  }
  return <LoginScreen />;
}

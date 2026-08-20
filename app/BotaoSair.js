"use client";

import { useRouter } from "next/navigation";

export default function BotaoSair() {
  const router = useRouter();

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button onClick={sair} className="botao-link">
      Sair
    </button>
  );
}

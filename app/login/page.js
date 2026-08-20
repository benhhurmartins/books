"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function FormularioLogin() {
  const searchParams = useSearchParams();
  const proximo = searchParams.get("proximo") || "/";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });
    const dados = await res.json();
    setCarregando(false);
    if (!res.ok) {
      setErro(dados.erro || "Não foi possível entrar.");
      return;
    }
    router.push(proximo);
    router.refresh();
  }

  return (
    <div className="form-caixa">
      <h1>Entrar</h1>
      <form onSubmit={aoEnviar}>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Senha</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />

        {erro && <p className="erro">{erro}</p>}

        <button className="botao" type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
        Não tem conta? <Link href="/cadastro">Cadastre-se</Link>
      </p>
    </div>
  );
}

export default function PaginaLogin() {
  return (
    <Suspense fallback={null}>
      <FormularioLogin />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PaginaCadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const res = await fetch("/api/auth/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha }),
    });
    const dados = await res.json();
    setCarregando(false);
    if (!res.ok) {
      setErro(dados.erro || "Não foi possível criar a conta.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="form-caixa">
      <h1>Criar conta</h1>
      <form onSubmit={aoEnviar}>
        <label>Nome</label>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Senha (mín. 6 caracteres)</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />

        {erro && <p className="erro">{erro}</p>}

        <button className="botao" type="submit" disabled={carregando}>
          {carregando ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </div>
  );
}

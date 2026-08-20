"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BotoesGerenciar({ livroId }) {
  const router = useRouter();

  async function excluir() {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    const res = await fetch(`/api/livros/${livroId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const dados = await res.json().catch(() => ({}));
      alert(dados.erro || "Não foi possível excluir o livro.");
    }
  }

  return (
    <div className="acoes-livro-dono">
      <Link href={`/livros/editar/${livroId}`} className="botao-link">Editar livro</Link>
      <button className="botao-link" style={{ color: "#a83232" }} onClick={excluir}>
        Excluir livro
      </button>
    </div>
  );
}

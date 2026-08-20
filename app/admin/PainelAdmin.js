"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PainelAdmin({ livrosIniciais }) {
  const [livros, setLivros] = useState(livrosIniciais);
  const [termo, setTermo] = useState("spurgeon");
  const [mensagem, setMensagem] = useState("");
  const [importando, setImportando] = useState(false);
  const router = useRouter();

  async function importarDaGutendex(e) {
    e.preventDefault();
    setImportando(true);
    setMensagem("");
    const res = await fetch("/api/importar-gutendex", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termo }),
    });
    const dados = await res.json();
    setImportando(false);
    if (!res.ok) {
      setMensagem(dados.erro || "Erro ao importar.");
      return;
    }
    setMensagem(`Importados: ${dados.importados} · Ignorados (já existiam ou sem link): ${dados.ignorados} · Total encontrado: ${dados.total}`);
    router.refresh();
    const atualizados = await fetch("/api/livros").then((r) => r.json());
    setLivros(atualizados.livros);
  }

  async function excluir(id) {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    await fetch(`/api/livros/${id}`, { method: "DELETE" });
    setLivros((atual) => atual.filter((l) => l.id !== id));
  }

  return (
    <div>
      <div className="barra-admin">
        <h1 style={{ margin: 0 }}>Painel Admin</h1>
        <Link href="/admin/novo" className="botao" style={{ width: "auto", margin: 0 }}>
          + Adicionar livro manualmente
        </Link>
      </div>

      <div className="importar-caixa">
        <h3 style={{ marginTop: 0 }}>Importar clássicos de domínio público (Gutendex / Project Gutenberg)</h3>
        <form onSubmit={importarDaGutendex}>
          <input
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="ex: spurgeon, bunyan, pilgrim's progress"
          />
          <button className="botao" style={{ width: "auto", margin: 0 }} type="submit" disabled={importando}>
            {importando ? "Importando..." : "Buscar e importar"}
          </button>
        </form>
        {mensagem && <p className="sucesso">{mensagem}</p>}
      </div>

      <table className="tabela-admin">
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Categoria</th>
            <th>Fonte</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {livros.map((livro) => (
            <tr key={livro.id}>
              <td>{livro.titulo}</td>
              <td>{livro.autor}</td>
              <td>{livro.categoria}</td>
              <td>{livro.fonte}</td>
              <td className="linha-acoes">
                <Link href={`/admin/editar/${livro.id}`}>Editar</Link>
                <button className="botao-link" style={{ color: "#a83232" }} onClick={() => excluir(livro.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

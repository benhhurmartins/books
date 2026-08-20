"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FormularioLivro({ livroExistente, voltarPara = "/admin" }) {
  const [titulo, setTitulo] = useState(livroExistente?.titulo || "");
  const [autor, setAutor] = useState(livroExistente?.autor || "");
  const [categoria, setCategoria] = useState(livroExistente?.categoria || "Devocional");
  const [descricao, setDescricao] = useState(livroExistente?.descricao || "");
  const [destaque, setDestaque] = useState(livroExistente?.destaque || false);

  // Capa: "url" (link) ou "arquivo" (upload de imagem)
  const [capaModo, setCapaModo] = useState("url");
  const [capaUrl, setCapaUrl] = useState(livroExistente?.capaUrl || "");
  const [capaArquivo, setCapaArquivo] = useState(null);

  // PDF: "url" (link) ou "arquivo" (upload do próprio PDF)
  const [pdfModo, setPdfModo] = useState("url");
  const [pdfUrl, setPdfUrl] = useState(livroExistente?.pdfUrl || "");
  const [pdfArquivo, setPdfArquivo] = useState(null);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function aoEnviar(e) {
    e.preventDefault();
    setErro("");

    if (pdfModo === "url" && !pdfUrl) {
      setErro("Informe o link do PDF ou envie o arquivo.");
      return;
    }
    if (pdfModo === "arquivo" && !pdfArquivo && !livroExistente?.pdfUrl) {
      setErro("Selecione o arquivo PDF para enviar.");
      return;
    }

    setCarregando(true);

    const formData = new FormData();
    formData.set("titulo", titulo);
    formData.set("autor", autor);
    formData.set("categoria", categoria);
    formData.set("descricao", descricao);
    formData.set("destaque", destaque ? "true" : "false");

    formData.set("capaModo", capaModo);
    if (capaModo === "url") {
      formData.set("capaUrl", capaUrl);
    } else if (capaArquivo) {
      formData.set("capaArquivo", capaArquivo);
    }

    formData.set("pdfModo", pdfModo);
    if (pdfModo === "url") {
      formData.set("pdfUrl", pdfUrl);
    } else if (pdfArquivo) {
      formData.set("pdfArquivo", pdfArquivo);
    }

    const url = livroExistente ? `/api/livros/${livroExistente.id}` : "/api/livros";
    const metodo = livroExistente ? "PUT" : "POST";

    const res = await fetch(url, { method: metodo, body: formData });
    const dados = await res.json();
    setCarregando(false);

    if (!res.ok) {
      setErro(dados.erro || "Não foi possível salvar o livro.");
      return;
    }
    router.push(voltarPara);
    router.refresh();
  }

  return (
    <div className="form-caixa" style={{ maxWidth: 520 }}>
      <h1>{livroExistente ? "Editar livro" : "Adicionar livro"}</h1>
      <form onSubmit={aoEnviar}>
        <label>Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />

        <label>Autor</label>
        <input value={autor} onChange={(e) => setAutor(e.target.value)} required />

        <label>Categoria</label>
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} required placeholder="Devocional, Teologia, Biografia..." />

        <label>Descrição (opcional)</label>
        <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />

        <fieldset className="campo-modo">
          <legend>Imagem da capa (opcional)</legend>
          <div className="alternador-modo">
            <label className="opcao-modo">
              <input
                type="radio"
                name="capaModo"
                checked={capaModo === "url"}
                onChange={() => setCapaModo("url")}
              />
              Link (URL)
            </label>
            <label className="opcao-modo">
              <input
                type="radio"
                name="capaModo"
                checked={capaModo === "arquivo"}
                onChange={() => setCapaModo("arquivo")}
              />
              Enviar imagem
            </label>
          </div>

          {capaModo === "url" ? (
            <input value={capaUrl} onChange={(e) => setCapaUrl(e.target.value)} placeholder="https://..." />
          ) : (
            <>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setCapaArquivo(e.target.files?.[0] || null)}
              />
              {livroExistente?.capaUrl && !capaArquivo && (
                <p className="dica-campo">Deixe em branco para manter a capa atual.</p>
              )}
            </>
          )}
        </fieldset>

        <fieldset className="campo-modo">
          <legend>Arquivo do livro (PDF)</legend>
          <div className="alternador-modo">
            <label className="opcao-modo">
              <input
                type="radio"
                name="pdfModo"
                checked={pdfModo === "url"}
                onChange={() => setPdfModo("url")}
              />
              Link (URL)
            </label>
            <label className="opcao-modo">
              <input
                type="radio"
                name="pdfModo"
                checked={pdfModo === "arquivo"}
                onChange={() => setPdfModo("arquivo")}
              />
              Enviar PDF
            </label>
          </div>

          {pdfModo === "url" ? (
            <input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://.../livro.pdf" />
          ) : (
            <>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfArquivo(e.target.files?.[0] || null)}
              />
              {livroExistente?.pdfUrl && !pdfArquivo && (
                <p className="dica-campo">Deixe em branco para manter o PDF atual.</p>
              )}
            </>
          )}
        </fieldset>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={destaque} onChange={(e) => setDestaque(e.target.checked)} />
          Destacar este livro no topo do catálogo
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button className="botao" type="submit" disabled={carregando}>
          {carregando ? "Salvando..." : "Salvar livro"}
        </button>
      </form>
    </div>
  );
}

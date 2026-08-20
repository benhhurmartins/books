import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { pegarUsuarioAtual } from "@/lib/auth";
import BotoesGerenciar from "./BotoesGerenciar";

export default async function PaginaLivro({ params }) {
  const livro = await prisma.livro.findUnique({ where: { id: params.id } });
  if (!livro) notFound();

  const usuario = pegarUsuarioAtual();
  const podeGerenciar = usuario && (usuario.papel === "ADMIN" || livro.criadoPorId === usuario.id);

  return (
    <div className="pagina-livro">
      {livro.capaUrl ? (
        <img src={livro.capaUrl} alt={livro.titulo} className="capa-livro" />
      ) : (
        <div className="capa-vazia">📘</div>
      )}
      <div className="detalhes-livro">
        <span className="tag-categoria">{livro.categoria}</span>
        <h1>{livro.titulo}</h1>
        <p className="subtitulo">por {livro.autor}</p>
        {livro.descricao && <p>{livro.descricao}</p>}
        <a href={livro.pdfUrl} target="_blank" rel="noopener noreferrer" className="botao-download">
          ⬇️ Baixar / Ler PDF
        </a>
        {podeGerenciar && <BotoesGerenciar livroId={livro.id} />}
      </div>
    </div>
  );
}

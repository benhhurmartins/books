import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pegarUsuarioAtual } from "@/lib/auth";
import { processarFormularioLivro } from "@/lib/livroForm";

// GET /api/livros?busca=texto&categoria=Teologia — catálogo público
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const busca = searchParams.get("busca")?.trim();
  const categoria = searchParams.get("categoria")?.trim();
  const autor = searchParams.get("autor")?.trim();

  const where = {
    AND: [
      busca
        ? {
            OR: [
              { titulo: { contains: busca } },
              { autor: { contains: busca } },
            ],
          }
        : {},
      autor ? { autor: { contains: autor } } : {},
      categoria && categoria !== "Todas" ? { categoria } : {},
    ],
  };

  const livros = await prisma.livro.findMany({
    where,
    orderBy: [{ destaque: "desc" }, { criadoEm: "desc" }],
  });

  return NextResponse.json({ livros });
}

// POST /api/livros — qualquer usuário logado (não só admin) pode cadastrar um livro,
// via link (URL) ou enviando o próprio arquivo (PDF + imagem de capa).
export async function POST(req) {
  const usuario = pegarUsuarioAtual();
  if (!usuario) {
    return NextResponse.json(
      { erro: "Você precisa estar logado para cadastrar um livro." },
      { status: 401 }
    );
  }

  let dados;
  try {
    const formData = await req.formData();
    dados = await processarFormularioLivro(formData);
  } catch (erro) {
    return NextResponse.json({ erro: erro.message || "Não foi possível processar o envio." }, { status: 400 });
  }

  const { titulo, autor, categoria, descricao, capaUrl, pdfUrl, destaque } = dados;

  if (!titulo || !autor || !categoria || !pdfUrl) {
    return NextResponse.json(
      { erro: "Preencha ao menos título, autor, categoria e o PDF (link ou arquivo)." },
      { status: 400 }
    );
  }

  const livro = await prisma.livro.create({
    data: {
      titulo,
      autor,
      categoria,
      descricao: descricao || null,
      capaUrl: capaUrl || null,
      pdfUrl,
      destaque: !!destaque,
      fonte: "MANUAL",
      criadoPorId: usuario.id,
    },
  });

  return NextResponse.json({ ok: true, livro });
}

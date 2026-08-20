import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pegarUsuarioAtual } from "@/lib/auth";
import { processarFormularioLivro } from "@/lib/livroForm";

export async function GET(_req, { params }) {
  const livro = await prisma.livro.findUnique({ where: { id: params.id } });
  if (!livro) return NextResponse.json({ erro: "Livro não encontrado." }, { status: 404 });
  return NextResponse.json({ livro });
}

// Só pode editar/excluir: administrador OU o próprio usuário que cadastrou o livro.
function podeGerenciar(usuario, livro) {
  if (!usuario) return false;
  if (usuario.papel === "ADMIN") return true;
  return livro.criadoPorId && livro.criadoPorId === usuario.id;
}

export async function PUT(req, { params }) {
  const usuario = pegarUsuarioAtual();
  const livroAtual = await prisma.livro.findUnique({ where: { id: params.id } });
  if (!livroAtual) return NextResponse.json({ erro: "Livro não encontrado." }, { status: 404 });

  if (!podeGerenciar(usuario, livroAtual)) {
    return NextResponse.json(
      { erro: "Você não tem permissão para editar este livro." },
      { status: 403 }
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

  const livro = await prisma.livro.update({
    where: { id: params.id },
    data: {
      titulo,
      autor,
      categoria,
      descricao: descricao || null,
      // mantém a capa/pdf atual se o usuário deixar em branco na edição
      capaUrl: capaUrl || livroAtual.capaUrl,
      pdfUrl: pdfUrl || livroAtual.pdfUrl,
      destaque: !!destaque,
    },
  });

  return NextResponse.json({ ok: true, livro });
}

export async function DELETE(_req, { params }) {
  const usuario = pegarUsuarioAtual();
  const livroAtual = await prisma.livro.findUnique({ where: { id: params.id } });
  if (!livroAtual) return NextResponse.json({ erro: "Livro não encontrado." }, { status: 404 });

  if (!podeGerenciar(usuario, livroAtual)) {
    return NextResponse.json(
      { erro: "Você não tem permissão para excluir este livro." },
      { status: 403 }
    );
  }

  await prisma.livro.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

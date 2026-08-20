import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pegarUsuarioAtual } from "@/lib/auth";

// Escolhe o melhor link disponível nos "formats" retornados pela Gutendex.
// A Gutendex nem sempre tem PDF puro; damos preferência a PDF e caímos para HTML/texto.
function escolherLink(formats) {
  return (
    formats["application/pdf"] ||
    formats["text/html; charset=utf-8"] ||
    formats["text/html"] ||
    formats["text/plain; charset=utf-8"] ||
    formats["text/plain"] ||
    null
  );
}

function escolherCapa(formats) {
  return formats["image/jpeg"] || null;
}

// POST /api/importar-gutendex  { termo: "spurgeon" }  — apenas admin
export async function POST(req) {
  const usuario = pegarUsuarioAtual();
  if (!usuario || usuario.papel !== "ADMIN") {
    return NextResponse.json({ erro: "Acesso restrito a administradores." }, { status: 403 });
  }

  const { termo } = await req.json();
  if (!termo) {
    return NextResponse.json({ erro: "Informe um termo de busca (ex: spurgeon, bunyan)." }, { status: 400 });
  }

  const resposta = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(termo)}`);
  if (!resposta.ok) {
    return NextResponse.json({ erro: "Não foi possível consultar a Gutendex agora." }, { status: 502 });
  }
  const dados = await resposta.json();

  let importados = 0;
  let ignorados = 0;

  for (const livroApi of dados.results || []) {
    const link = escolherLink(livroApi.formats || {});
    if (!link) {
      ignorados++;
      continue;
    }

    const autor = livroApi.authors?.[0]?.name || "Autor desconhecido";
    const fonteId = String(livroApi.id);

    const jaExiste = await prisma.livro.findUnique({
      where: { fonte_fonteId: { fonte: "GUTENDEX", fonteId } },
    });
    if (jaExiste) {
      ignorados++;
      continue;
    }

    await prisma.livro.create({
      data: {
        titulo: livroApi.title,
        autor,
        categoria: "Clássico (Domínio Público)",
        descricao: `Obra em domínio público, importada automaticamente via Project Gutenberg (Gutendex).`,
        capaUrl: escolherCapa(livroApi.formats || {}),
        pdfUrl: link,
        fonte: "GUTENDEX",
        fonteId,
      },
    });
    importados++;
  }

  return NextResponse.json({ ok: true, importados, ignorados, total: dados.results?.length || 0 });
}

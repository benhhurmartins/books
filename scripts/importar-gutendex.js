require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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

async function main() {
  const termo = process.argv.slice(2).join(" ").trim();
  if (!termo) {
    console.log("Uso: npm run importar-gutendex -- spurgeon");
    process.exitCode = 1;
    return;
  }

  const resposta = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(termo)}`);
  if (!resposta.ok) throw new Error(`Gutendex respondeu com ${resposta.status}`);
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
        descricao: "Obra importada do Project Gutenberg por meio da Gutendex.",
        capaUrl: escolherCapa(livroApi.formats || {}),
        pdfUrl: link,
        fonte: "GUTENDEX",
        fonteId,
      },
    });
    importados++;
  }

  console.log(`Importados: ${importados}`);
  console.log(`Ignorados: ${ignorados}`);
  console.log(`Total encontrado: ${dados.results?.length || 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());

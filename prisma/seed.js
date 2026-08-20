require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const LIVROS_INICIAIS = [
  {
    fonteId: "gutenberg-131",
    titulo: "The Pilgrim's Progress",
    autor: "John Bunyan",
    categoria: "Clássico cristão",
    descricao: "Allegoria cristã clássica de John Bunyan, disponibilizada pelo Project Gutenberg.",
    capaUrl: "https://www.gutenberg.org/cache/epub/131/pg131.cover.medium.jpg",
    pdfUrl: "https://www.gutenberg.org/ebooks/131",
    fonte: "GUTENBERG",
    destaque: true,
  },
  {
    fonteId: "gutenberg-26990",
    titulo: "Holy in Christ",
    autor: "Andrew Murray",
    categoria: "Santidade",
    descricao: "Obra de Andrew Murray sobre a vida cristã e o chamado à santidade.",
    capaUrl: "https://www.gutenberg.org/cache/epub/26990/pg26990.cover.medium.jpg",
    pdfUrl: "https://www.gutenberg.org/ebooks/26990",
    fonte: "GUTENBERG",
    destaque: true,
  },
  {
    fonteId: "gutenberg-12854",
    titulo: "The Master's Indwelling",
    autor: "Andrew Murray",
    categoria: "Vida cristã",
    descricao: "Reflexões de Andrew Murray sobre a presença de Cristo e a vida no Espírito.",
    capaUrl: "https://www.gutenberg.org/cache/epub/12854/pg12854.cover.medium.jpg",
    pdfUrl: "https://www.gutenberg.org/ebooks/12854",
    fonte: "GUTENBERG",
    destaque: false,
  },
  {
    fonteId: "gutenberg-26003",
    titulo: "Jesus Himself",
    autor: "Andrew Murray",
    categoria: "Cristologia",
    descricao: "Livro devocional de Andrew Murray centrado na experiência pessoal com Cristo.",
    capaUrl: "https://www.gutenberg.org/cache/epub/26003/pg26003.cover.medium.jpg",
    pdfUrl: "https://www.gutenberg.org/ebooks/26003",
    fonte: "GUTENBERG",
    destaque: false,
  },
];

async function main() {
  const nome = process.env.ADMIN_NOME || "Administrador";
  const email = process.env.ADMIN_EMAIL || "admin@livrosgospel.local";
  const senha = process.env.ADMIN_SENHA || "LivrosGospel123!";

  const senhaHash = await bcrypt.hash(senha, 10);
  await prisma.usuario.upsert({
    where: { email },
    update: { nome, senhaHash, papel: "ADMIN" },
    create: { nome, email, senhaHash, papel: "ADMIN" },
  });

  for (const livro of LIVROS_INICIAIS) {
    await prisma.livro.upsert({
      where: { fonte_fonteId: { fonte: livro.fonte, fonteId: livro.fonteId } },
      update: livro,
      create: livro,
    });
  }

  console.log("Banco preparado com sucesso!");
  console.log(`Admin: ${email}`);
  console.log(`Senha: ${senha}`);
  console.log(`Livros iniciais: ${LIVROS_INICIAIS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

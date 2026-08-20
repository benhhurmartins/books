import { prisma } from "@/lib/db";
import PainelAdmin from "./PainelAdmin";

export default async function PaginaAdmin() {
  const livros = await prisma.livro.findMany({ orderBy: { criadoEm: "desc" } });
  return <PainelAdmin livrosIniciais={livros} />;
}

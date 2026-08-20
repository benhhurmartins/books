import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import FormularioLivro from "../../FormularioLivro";

export default async function PaginaEditarLivro({ params }) {
  const livro = await prisma.livro.findUnique({ where: { id: params.id } });
  if (!livro) notFound();
  return <FormularioLivro livroExistente={livro} />;
}

import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pegarUsuarioAtual } from "@/lib/auth";
import FormularioLivro from "../../../admin/FormularioLivro";

export default async function PaginaEditarLivroPublico({ params }) {
  const usuario = pegarUsuarioAtual();
  if (!usuario) redirect(`/login?proximo=/livros/editar/${params.id}`);

  const livro = await prisma.livro.findUnique({ where: { id: params.id } });
  if (!livro) notFound();

  const podeEditar = usuario.papel === "ADMIN" || livro.criadoPorId === usuario.id;
  if (!podeEditar) redirect(`/livros/${params.id}`);

  return <FormularioLivro livroExistente={livro} voltarPara={`/livros/${params.id}`} />;
}

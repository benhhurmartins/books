import { redirect } from "next/navigation";
import { pegarUsuarioAtual } from "@/lib/auth";
import FormularioLivro from "../../admin/FormularioLivro";

export default function PaginaNovoLivroPublico() {
  const usuario = pegarUsuarioAtual();
  if (!usuario) redirect("/login?proximo=/livros/novo");

  return <FormularioLivro voltarPara="/" />;
}

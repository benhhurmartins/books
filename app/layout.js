import "./globals.css";
import Link from "next/link";
import { pegarUsuarioAtual } from "@/lib/auth";
import BotaoSair from "./BotaoSair";

export const metadata = {
  title: "Livros Gospel | Biblioteca Cristã",
  description: "Biblioteca cristã com livros, autores e busca por título ou categoria.",
};

export default function RootLayout({ children }) {
  const usuario = pegarUsuarioAtual();

  return (
    <html lang="pt-BR">
      <body>
        <header className="cabecalho">
          <Link href="/" className="logo">📖 Livros Gospel</Link>
          <nav className="nav">
            {usuario ? (
              <>
                <span className="saudacao">Olá, {usuario.nome}</span>
                <Link href="/livros/novo" className="botao-nav">+ Adicionar livro</Link>
                {usuario.papel === "ADMIN" && <Link href="/admin">Painel Admin</Link>}
                <BotaoSair />
              </>
            ) : (
              <>
                <Link href="/login">Entrar</Link>
                <Link href="/cadastro" className="botao-nav">Criar conta</Link>
              </>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="rodape">
          <p>Livros Gospel Grátis — compartilhando fé através da leitura.</p>
        </footer>
      </body>
    </html>
  );
}

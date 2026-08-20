# Livros Gospel — catálogo integrado 📖

Projeto Next.js 14 + Prisma + SQLite.

## O que esta versão faz

- Mostra o catálogo local logo na entrada.
- Pesquisa por título, autor e categoria.
- Consulta automaticamente quatro fontes de descoberta:
  - Google Books
  - Open Library
  - Gutendex / Project Gutenberg
  - Internet Archive
- Prioriza resultados em português.
- Mostra capa, autor, ano e fonte.
- Exibe **Baixar PDF** somente quando a fonte informa que a cópia pode ser baixada de forma livre/domínio público.
- Nos demais casos, mostra **Ver disponibilidade** para o registro da obra.
- O Google Books é usado sem chave por padrão; uma chave opcional pode ser colocada em `GOOGLE_BOOKS_API_KEY`.

## Rodar no Windows

```bash
npm install
npm run dev
```

O projeto prepara o Prisma e o SQLite automaticamente no início.

Depois acesse `http://localhost:3000`.

## Observação sobre direitos

As APIs de catálogo não significam que todo livro esteja disponível para download. O site não tenta contornar paywalls, DRM ou restrições de acesso. O download direto só é exibido quando a fonte sinaliza uma cópia livre/domínio público.

## Fontes e APIs

- Google Books Volumes API
- Open Library Search API
- Gutendex API
- Internet Archive Metadata/Advanced Search APIs

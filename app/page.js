import Link from "next/link";
import { prisma } from "@/lib/db";
import BuscaExterna from "./BuscaExterna";

const AUTORES_SUGERIDOS = [
  "Francine Verissimo",
  "James Long",
  "Charles Spurgeon",
  "John Bunyan",
  "Jonathan Edwards",
  "Andrew Murray",
  "A.W. Tozer",
  "Billy Graham",
];

async function buscarLivros(searchParams = {}) {
  const busca = searchParams.busca?.trim();
  const autor = searchParams.autor?.trim();
  const categoria = searchParams.categoria?.trim();

  const where = {
    AND: [
      busca
        ? {
            OR: [
              { titulo: { contains: busca } },
              { autor: { contains: busca } },
              { categoria: { contains: busca } },
            ],
          }
        : {},
      autor ? { autor: { contains: autor } } : {},
      categoria && categoria !== "Todas" ? { categoria } : {},
    ],
  };

  return prisma.livro.findMany({
    where,
    orderBy: [{ destaque: "desc" }, { criadoEm: "desc" }],
  });
}

export default async function Home({ searchParams }) {
  const livros = await buscarLivros(searchParams);

  const categorias = await prisma.livro.findMany({
    select: { categoria: true },
    distinct: ["categoria"],
    orderBy: { categoria: "asc" },
  });

  const autoresDoCatalogo = await prisma.livro.findMany({
    select: { autor: true },
    distinct: ["autor"],
    orderBy: { autor: "asc" },
  });

  const autores = [
    ...new Set([
      ...AUTORES_SUGERIDOS,
      ...autoresDoCatalogo.map((item) => item.autor),
    ]),
  ];

  const temFiltro = Boolean(searchParams.busca || searchParams.autor || (searchParams.categoria && searchParams.categoria !== "Todas"));

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-conteudo">
          <span className="hero-tag">✦ Biblioteca cristã</span>
          <h1>Encontre livros que fortalecem a sua fé.</h1>
          <p>
            Pesquise por título, autor ou categoria e descubra livros cristãos
            disponíveis no catálogo.
          </p>

          <form className="busca-principal" action="/" method="get">
            <span className="icone-busca">⌕</span>
            <input
              type="search"
              name="busca"
              placeholder="Digite o nome do livro ou autor..."
              defaultValue={searchParams.busca || ""}
              aria-label="Pesquisar livros ou autores"
            />
            <button type="submit">Pesquisar</button>
          </form>
        </div>
        <div className="hero-livro" aria-hidden="true">📖</div>
      </section>

      <section className="secao-autores">
        <div className="titulo-secao">
          <div>
            <span className="eyebrow">Explore por autor</span>
            <h2>Autores em destaque</h2>
          </div>
          <span className="contador">{autores.length} autores sugeridos</span>
        </div>
        <div className="lista-autores">
          {autores.map((autor) => (
            <Link
              key={autor}
              href={`/?autor=${encodeURIComponent(autor)}`}
              className={`autor-chip ${searchParams.autor === autor ? "ativo" : ""}`}
            >
              <span className="avatar-autor">{autor.charAt(0)}</span>
              {autor}
            </Link>
          ))}
        </div>
      </section>

      <section className="catalogo">
        <div className="titulo-secao catalogo-topo">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h2>{temFiltro ? "Resultados da pesquisa" : "Livros disponíveis"}</h2>
          </div>
          <span className="contador">{livros.length} livro{livros.length === 1 ? "" : "s"}</span>
        </div>

        <form className="filtros" action="/" method="get">
          <input
            type="search"
            name="busca"
            placeholder="Título, autor ou categoria..."
            defaultValue={searchParams.busca || ""}
          />
          <select name="categoria" defaultValue={searchParams.categoria || "Todas"}>
            <option value="Todas">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.categoria} value={c.categoria}>{c.categoria}</option>
            ))}
          </select>
          <button className="botao" type="submit">Filtrar</button>
          {temFiltro && <Link href="/" className="limpar-filtros">Limpar filtros</Link>}
        </form>

        {livros.length === 0 ? (
          <div className="estado-vazio">
            <div className="vazio-icone">📚</div>
            <h3>Nenhum livro encontrado</h3>
            <p>
              {searchParams.autor
                ? `Ainda não há livros cadastrados de ${searchParams.autor}.`
                : "Tente pesquisar por outro título, autor ou categoria."}
            </p>
            <Link href="/" className="botao botao-vazio">Ver todos os livros</Link>
          </div>
        ) : (
          <div className="grade-livros">
            {livros.map((livro) => (
              <Link key={livro.id} href={`/livros/${livro.id}`} className="cartao-livro">
                <div className="capa-wrapper">
                  {livro.capaUrl ? (
                    <img src={livro.capaUrl} alt={`Capa de ${livro.titulo}`} className="capa-livro" />
                  ) : (
                    <div className="capa-vazia">📘</div>
                  )}
                  {livro.destaque && <span className="selo-destaque">Destaque</span>}
                </div>
                <div className="info-livro">
                  <span className="titulo-livro">{livro.titulo}</span>
                  <span className="autor-livro">por {livro.autor}</span>
                  <span className="tag-categoria">{livro.categoria}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BuscaExterna
        busca={searchParams.busca || ""}
        autor={searchParams.autor || ""}
      />
    </div>
  );
}

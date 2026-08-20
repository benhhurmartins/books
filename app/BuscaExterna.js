"use client";

import { useEffect, useState } from "react";

export default function BuscaExterna({ busca = "", autor = "" }) {
  const [livros, setLivros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [fontes, setFontes] = useState({});

  useEffect(() => {
    let ativo = true;
    const controlador = new AbortController();

    async function carregar() {
      setCarregando(true);
      setErro("");
      try {
        const params = new URLSearchParams();
        if (busca) params.set("busca", busca);
        if (autor) params.set("autor", autor);

        const resposta = await fetch(`/api/busca-externa?${params.toString()}`, {
          signal: controlador.signal,
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Erro na busca");
        if (ativo) {
          setLivros(dados.livros || []);
          setFontes(dados.fontes || {});
        }
      } catch (e) {
        if (e.name !== "AbortError" && ativo) {
          setErro("Não foi possível carregar os catálogos externos agora.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
      controlador.abort();
    };
  }, [busca, autor]);

  return (
    <section className="catalogo catalogo-externo">
      <div className="titulo-secao catalogo-topo">
        <div>
          <span className="eyebrow">Catálogos integrados</span>
          <h2>Mais livros cristãos em português</h2>
          <p className="subtitulo-catalogo">
            Google Books, Open Library, Gutendex e Internet Archive são consultados automaticamente.
          </p>
        </div>
        <span className="contador">{livros.length} encontrados</span>
      </div>

      <div className="fontes-status" aria-label="Status das fontes">
        {[
          ["Google Books", fontes.googleBooks],
          ["Open Library", fontes.openLibrary],
          ["Gutendex", fontes.gutendex],
          ["Internet Archive", fontes.internetArchive],
        ].map(([nome, ok]) => (
          <span className={`fonte-status ${ok ? "ok" : "indisponivel"}`} key={nome}>
            <span>{ok ? "●" : "○"}</span> {nome}
          </span>
        ))}
      </div>

      {carregando && (
        <div className="estado-vazio estado-carregando">
          <div className="vazio-icone">🔎</div>
          <h3>Pesquisando em vários catálogos...</h3>
          <p>Estamos procurando livros cristãos em português e verificando se existe PDF livre para download.</p>
        </div>
      )}

      {!carregando && erro && (
        <div className="estado-vazio">
          <div className="vazio-icone">⚠️</div>
          <h3>Busca externa indisponível</h3>
          <p>{erro}</p>
        </div>
      )}

      {!carregando && !erro && livros.length === 0 && (
        <div className="estado-vazio">
          <div className="vazio-icone">📚</div>
          <h3>Nenhum resultado externo</h3>
          <p>Tente outro autor, título ou termo de pesquisa.</p>
        </div>
      )}

      {!carregando && !erro && livros.length > 0 && (
        <div className="grade-livros">
          {livros.map((livro) => (
            <article key={livro.id} className="cartao-livro cartao-externo">
              <a href={livro.url} target="_blank" rel="noopener noreferrer">
                <div className="capa-wrapper">
                  {livro.capaUrl ? (
                    <img src={livro.capaUrl} alt={`Capa de ${livro.titulo}`} className="capa-livro" loading="lazy" />
                  ) : (
                    <div className="capa-vazia">📘</div>
                  )}
                  <span className="selo-fonte">{livro.fonte}</span>
                </div>
              </a>
              <div className="info-livro">
                <a href={livro.url} target="_blank" rel="noopener noreferrer" className="titulo-livro">{livro.titulo}</a>
                <span className="autor-livro">por {livro.autor}</span>
                {livro.publicadoEm && <span className="ano-livro">{livro.publicadoEm}</span>}
                <span className="tag-categoria">{livro.categoria}</span>

                <div className="acoes-externas">
                  {livro.downloadUrl ? (
                    <a
                      href={livro.downloadUrl}
                      className="botao-download-mini"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ⬇️ Baixar PDF
                    </a>
                  ) : (
                    <a href={livro.url} target="_blank" rel="noopener noreferrer" className="ler-externo">
                      Ver disponibilidade ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="aviso-fonte">
        O botão <strong>Baixar PDF</strong> só aparece quando a própria fonte informa uma cópia livre ou em domínio público. Nos demais casos, o cartão abre apenas o registro da obra.
      </p>
    </section>
  );
}

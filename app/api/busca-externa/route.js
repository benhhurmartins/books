import { NextResponse } from "next/server";

const USER_AGENT = "LivrosGospel/2.0 (biblioteca cristã; descoberta de livros)";

function textoSeguro(valor, fallback = "") {
  return typeof valor === "string" ? valor.trim() : fallback;
}

function extrairResumo(texto) {
  const limpo = String(texto || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return limpo.length > 220 ? `${limpo.slice(0, 217)}...` : limpo;
}

function primeiroUrlPdf(formats = {}) {
  const entrada = Object.entries(formats).find(([mime, url]) => {
    return /pdf/i.test(mime) && typeof url === "string" && /^https?:\/\//i.test(url);
  });
  return entrada?.[1] || null;
}

function normalizarGoogle(item) {
  const info = item.volumeInfo || {};
  const access = item.accessInfo || {};
  const autores = Array.isArray(info.authors) && info.authors.length
    ? info.authors.join(", ")
    : "Autor não informado";
  const capa = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;

  // Só oferecemos download direto quando o próprio Google informa domínio público.
  const downloadUrl = access.publicDomain && access.pdf?.isAvailable
    ? access.pdf?.downloadLink || null
    : null;

  return {
    id: `google-${item.id}`,
    titulo: textoSeguro(info.title, "Sem título"),
    autor: autores,
    descricao: extrairResumo(info.description),
    capaUrl: capa ? capa.replace(/^http:/, "https:") : null,
    url: access.webReaderLink || info.infoLink || `https://books.google.com/books?id=${item.id}`,
    fonte: "Google Books",
    publicadoEm: textoSeguro(info.publishedDate),
    categoria: Array.isArray(info.categories) && info.categories.length ? info.categories[0] : "Cristão",
    downloadUrl,
    downloadTipo: downloadUrl ? "PDF direto · domínio público" : null,
  };
}

async function buscarGoogleBooks(q) {
  const params = new URLSearchParams({
    q,
    langRestrict: "pt",
    maxResults: "20",
    orderBy: "relevance",
    printType: "books",
  });
  if (process.env.GOOGLE_BOOKS_API_KEY) params.set("key", process.env.GOOGLE_BOOKS_API_KEY);

  const resposta = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 600 },
  });
  if (!resposta.ok) throw new Error(`Google Books respondeu ${resposta.status}`);
  const dados = await resposta.json();
  return (dados.items || []).map(normalizarGoogle);
}

async function buscarOpenLibrary(q) {
  if (/^https?:\/\//i.test(q)) return [];

  const params = new URLSearchParams({
    q,
    lang: "pt",
    limit: "20",
    fields: "key,title,author_name,first_publish_year,cover_i,subject,edition_key,language,isbn,availability",
  });

  const resposta = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: 600 },
  });
  if (!resposta.ok) throw new Error(`Open Library respondeu ${resposta.status}`);
  const dados = await resposta.json();

  return (dados.docs || []).map((item) => {
    const autor = Array.isArray(item.author_name) && item.author_name.length
      ? item.author_name.join(", ")
      : "Autor não informado";
    const titulo = textoSeguro(item.title, "Sem título");
    const key = item.key || item.edition_key?.[0] || titulo;
    const capa = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null;
    const url = item.key ? `https://openlibrary.org${item.key}` : "https://openlibrary.org/";
    const availability = item.availability?.status || item.availability?.is_readable || null;

    return {
      id: `openlibrary-${String(key).replace(/[^a-zA-Z0-9]/g, "-")}`,
      titulo,
      autor,
      descricao: "Resultado do catálogo da Open Library.",
      capaUrl: capa,
      url,
      fonte: "Open Library",
      publicadoEm: item.first_publish_year ? String(item.first_publish_year) : "",
      categoria: Array.isArray(item.subject) && item.subject.length ? item.subject[0] : "Cristão",
      downloadUrl: null,
      downloadTipo: null,
      disponibilidade: availability,
    };
  });
}

async function buscarGutendex(q) {
  const params = new URLSearchParams({
    search: q,
    languages: "pt",
    mime_type: "application/pdf",
    page: "1",
  });

  const resposta = await fetch(`https://gutendex.com/books?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: 600 },
  });
  if (!resposta.ok) throw new Error(`Gutendex respondeu ${resposta.status}`);
  const dados = await resposta.json();

  return (dados.results || []).slice(0, 20).map((item) => {
    const autor = item.authors?.map((a) => a.name).filter(Boolean).join(", ") || "Autor não informado";
    const pdf = primeiroUrlPdf(item.formats);
    const capa = item.formats?.["image/jpeg"] || null;
    const url = `https://www.gutenberg.org/ebooks/${item.id}`;

    // Gutendex expõe o status de copyright; o download direto só aparece quando é explicitamente false.
    const downloadUrl = item.copyright === false ? pdf : null;

    return {
      id: `gutendex-${item.id}`,
      titulo: textoSeguro(item.title, "Sem título"),
      autor,
      descricao: extrairResumo(item.summaries?.[0]),
      capaUrl: capa,
      url,
      fonte: "Gutendex / Project Gutenberg",
      publicadoEm: "",
      categoria: item.subjects?.[0] || item.bookshelves?.[0] || "Clássico cristão",
      downloadUrl,
      downloadTipo: downloadUrl ? "PDF direto · Project Gutenberg" : null,
    };
  });
}

async function buscarInternetArchive(q) {
  // Limitamos a itens classificados como domínio público / livre para exibir download direto.
  const params = new URLSearchParams({
    q: `${q} AND mediatype:texts AND language:por AND (rights:("public domain") OR rights:("publicdomain"))`,
    fl: ["identifier", "title", "creator", "year", "description"].join(","),
    rows: "12",
    page: "1",
    output: "json",
  });

  const resposta = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: 900 },
  });
  if (!resposta.ok) throw new Error(`Internet Archive respondeu ${resposta.status}`);
  const dados = await resposta.json();
  const docs = dados.response?.docs || [];

  const detalhes = await Promise.allSettled(docs.slice(0, 8).map(async (item) => {
    const meta = await fetch(`https://archive.org/metadata/${encodeURIComponent(item.identifier)}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 1800 },
    });
    if (!meta.ok) return null;
    const metadata = await meta.json();
    const rights = JSON.stringify(metadata.metadata?.rights || "").toLowerCase();
    const livre = rights.includes("public domain") || rights.includes("publicdomain") || rights.includes("creativecommons.org/publicdomain") || rights.includes("creativecommons") || rights.includes("cc by") || rights.includes("cc0");
    if (!livre) return null;

    const pdfFile = (metadata.files || []).find((f) => {
      const name = String(f.name || "").toLowerCase();
      return name.endsWith(".pdf") && !name.includes("_text.pdf");
    }) || (metadata.files || []).find((f) => String(f.name || "").toLowerCase().endsWith(".pdf"));

    return {
      id: `archive-${item.identifier}`,
      titulo: textoSeguro(item.title, "Sem título"),
      autor: Array.isArray(item.creator) ? item.creator.join(", ") : textoSeguro(item.creator, "Autor não informado"),
      descricao: extrairResumo(item.description),
      capaUrl: `https://archive.org/services/img/${encodeURIComponent(item.identifier)}`,
      url: `https://archive.org/details/${encodeURIComponent(item.identifier)}`,
      fonte: "Internet Archive",
      publicadoEm: textoSeguro(item.year ? String(item.year) : ""),
      categoria: "Cristão",
      downloadUrl: pdfFile ? `https://archive.org/download/${encodeURIComponent(item.identifier)}/${encodeURIComponent(pdfFile.name)}` : null,
      downloadTipo: pdfFile ? "PDF direto · item livre" : null,
    };
  }));

  return detalhes
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);
}

function chaveLivro(livro) {
  return `${livro.titulo}::${livro.autor}`.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const busca = textoSeguro(searchParams.get("busca"));
  const autor = textoSeguro(searchParams.get("autor"));

  const termoBase = autor || busca || "christianity";
  const termoGoogle = autor
    ? `inauthor:"${autor}"`
    : busca
      ? `${busca} christianity`
      : "subject:Christianity";
  const termoOpenLibrary = autor
    ? `author:"${autor}" (subject:christian OR subject:christianity OR subject:bible OR subject:religion)`
    : busca
      ? `${busca} (christian OR christianity OR bible OR theology)`
      : "(subject:christian OR subject:christianity OR subject:bible OR subject:theology)";
  const termoGutendex = autor || `${termoBase} christian`;

  const resultados = await Promise.allSettled([
    buscarGoogleBooks(termoGoogle),
    buscarOpenLibrary(termoOpenLibrary),
    buscarGutendex(termoGutendex),
    buscarInternetArchive(termoBase),
  ]);

  const nomes = ["googleBooks", "openLibrary", "gutendex", "internetArchive"];
  const porFonte = {};
  resultados.forEach((r, i) => { porFonte[nomes[i]] = r.status === "fulfilled"; });

  const livros = [];
  const vistos = new Set();
  const filas = resultados.flatMap((r) => r.status === "fulfilled" ? r.value : []);

  for (const livro of filas) {
    const chave = chaveLivro(livro);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    livros.push(livro);
    if (livros.length >= 48) break;
  }

  return NextResponse.json({
    livros,
    fontes: porFonte,
    termo: termoBase,
    observacao: "Downloads diretos aparecem apenas quando a fonte sinaliza uma cópia livre/domínio público.",
  });
}

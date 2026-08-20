import { nanoid } from "nanoid";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const PASTA_PUBLICA = path.join(process.cwd(), "public", "uploads");

const TIPOS_AUTORIZADOS = {
  pdf: {
    extensoes: [".pdf"],
    mimes: ["application/pdf"],
    tamanhoMaximo: 50 * 1024 * 1024, // 50MB
  },
  imagem: {
    extensoes: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    tamanhoMaximo: 8 * 1024 * 1024, // 8MB
  },
};

// Recebe um objeto File (vindo de request.formData()) e salva em /public/uploads/<subpasta>/
// Retorna a URL pública relativa (ex: "/uploads/pdfs/abc123.pdf") para gravar no banco.
export async function salvarArquivoEnviado(arquivo, tipo, subpasta) {
  if (!arquivo || typeof arquivo.arrayBuffer !== "function") {
    throw new Error("Nenhum arquivo válido foi enviado.");
  }

  const regras = TIPOS_AUTORIZADOS[tipo];
  if (!regras) throw new Error("Tipo de upload desconhecido.");

  if (arquivo.size > regras.tamanhoMaximo) {
    const limiteMb = Math.round(regras.tamanhoMaximo / (1024 * 1024));
    throw new Error(`Arquivo muito grande. O limite é ${limiteMb}MB.`);
  }

  const extensaoOriginal = path.extname(arquivo.name || "").toLowerCase();
  const mimeOk = regras.mimes.includes(arquivo.type);
  const extensaoOk = regras.extensoes.includes(extensaoOriginal);

  if (!mimeOk && !extensaoOk) {
    throw new Error(
      tipo === "pdf"
        ? "Envie um arquivo PDF válido."
        : "Envie uma imagem válida (jpg, png, webp ou gif)."
    );
  }

  const extensaoFinal = extensaoOk ? extensaoOriginal : regras.extensoes[0];
  const nomeArquivo = `${nanoid(12)}${extensaoFinal}`;

  const pastaDestino = path.join(PASTA_PUBLICA, subpasta);
  await mkdir(pastaDestino, { recursive: true });

  const bytes = Buffer.from(await arquivo.arrayBuffer());
  await writeFile(path.join(pastaDestino, nomeArquivo), bytes);

  return `/uploads/${subpasta}/${nomeArquivo}`;
}

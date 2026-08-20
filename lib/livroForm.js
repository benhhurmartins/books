import { salvarArquivoEnviado } from "./upload";

// Lê os campos de texto + arquivos de um FormData de cadastro/edição de livro
// e devolve os dados prontos para gravar no banco (capaUrl e pdfUrl resolvidos).
export async function processarFormularioLivro(formData) {
  const titulo = (formData.get("titulo") || "").toString().trim();
  const autor = (formData.get("autor") || "").toString().trim();
  const categoria = (formData.get("categoria") || "").toString().trim();
  const descricao = (formData.get("descricao") || "").toString().trim();
  const destaque = formData.get("destaque") === "true" || formData.get("destaque") === "on";

  // Capa: pode vir como link (capaUrl) ou como arquivo (capaArquivo)
  const capaModo = (formData.get("capaModo") || "url").toString();
  let capaUrl = (formData.get("capaUrl") || "").toString().trim();
  const capaArquivo = formData.get("capaArquivo");

  if (capaModo === "arquivo" && capaArquivo && capaArquivo.size > 0) {
    capaUrl = await salvarArquivoEnviado(capaArquivo, "imagem", "capas");
  }

  // PDF: pode vir como link (pdfUrl) ou como arquivo (pdfArquivo)
  const pdfModo = (formData.get("pdfModo") || "url").toString();
  let pdfUrl = (formData.get("pdfUrl") || "").toString().trim();
  const pdfArquivo = formData.get("pdfArquivo");

  if (pdfModo === "arquivo" && pdfArquivo && pdfArquivo.size > 0) {
    pdfUrl = await salvarArquivoEnviado(pdfArquivo, "pdf", "pdfs");
  }

  return { titulo, autor, categoria, descricao, destaque, capaUrl, pdfUrl };
}

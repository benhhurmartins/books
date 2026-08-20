import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const NOME_COOKIE = "sessao";
const SECRET = process.env.JWT_SECRET || "chave-de-desenvolvimento-insegura";

export async function gerarHash(senha) {
  return bcrypt.hash(senha, 10);
}

export async function conferirSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

export function criarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
    SECRET,
    { expiresIn: "30d" }
  );
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Lê o usuário logado a partir do cookie (uso em Server Components / route handlers)
export function pegarUsuarioAtual() {
  const token = cookies().get(NOME_COOKIE)?.value;
  if (!token) return null;
  return verificarToken(token);
}

export function nomeCookieSessao() {
  return NOME_COOKIE;
}

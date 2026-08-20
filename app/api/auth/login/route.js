import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { conferirSenha, criarToken, nomeCookieSessao } from "@/lib/auth";

export async function POST(req) {
  const { email, senha } = await req.json();

  if (!email || !senha) {
    return NextResponse.json({ erro: "Preencha email e senha." }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
  }

  const senhaConfere = await conferirSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
  }

  const token = criarToken(usuario);
  const res = NextResponse.json({ ok: true, usuario: { nome: usuario.nome, email: usuario.email, papel: usuario.papel } });
  res.cookies.set(nomeCookieSessao(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

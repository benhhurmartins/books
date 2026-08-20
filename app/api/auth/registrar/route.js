import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gerarHash, criarToken, nomeCookieSessao } from "@/lib/auth";

export async function POST(req) {
  const { nome, email, senha } = await req.json();

  if (!nome || !email || !senha) {
    return NextResponse.json({ erro: "Preencha nome, email e senha." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ erro: "A senha precisa ter ao menos 6 caracteres." }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ erro: "Este email já está cadastrado." }, { status: 409 });
  }

  const senhaHash = await gerarHash(senha);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash },
  });

  const token = criarToken(usuario);
  const res = NextResponse.json({ ok: true, usuario: { nome: usuario.nome, email: usuario.email } });
  res.cookies.set(nomeCookieSessao(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

import { NextResponse } from "next/server";
import { nomeCookieSessao } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(nomeCookieSessao(), "", { path: "/", maxAge: 0 });
  return res;
}

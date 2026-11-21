import { randomUUID, randomBytes } from "node:crypto";
import { signState, safeEqual } from "../../lib/google.js";

function html(message) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Conexão Google | RSA Digital</title><body style="font:16px system-ui;max-width:620px;margin:12vh auto;padding:24px;color:#172033"><h2>Conectar outra conta Google</h2><p>${message}</p><form method="post"><label>Chave de configuração<br><input name="key" type="password" required style="padding:12px;width:100%;max-width:420px;margin:10px 0"></label><br><label>Identificação desta conta (ex.: Gmail Mcqueen)<br><input name="label" type="text" maxlength="80" placeholder="Conta Google adicional" style="padding:12px;width:100%;max-width:420px;margin:10px 0"></label><br><button style="padding:12px 18px">Continuar com Google</button></form></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html("Informe a chave de configuração e um nome para identificar esta conta. A conta Google já conectada será preservada."));
  }
  if (req.method !== "POST") return res.status(405).send("Método não permitido.");
  const form = typeof req.body === "object" ? req.body : {};
  if (!safeEqual(form.key, process.env.GOOGLE_CONNECT_SECRET)) return res.status(401).send(html("Chave incorreta. Tente novamente."));
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).send("Configure GOOGLE_REDIRECT_URI, GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET na Vercel.");
  }
  const label = String(form.label || "Conta Google adicional").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80) || "Conta Google adicional";
  const state = signState({
    nonce: randomBytes(24).toString("base64url"),
    accountKey: randomUUID(),
    label,
    exp: Date.now() + 10 * 60 * 1000
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state
  }).toString();
  return res.redirect(302, url.toString());
}

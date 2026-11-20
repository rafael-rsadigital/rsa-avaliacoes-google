import { verifyState, exchangeGoogleCode } from "../../lib/google.js";

function page(title, message, success = false) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><body style="font:16px system-ui;max-width:680px;margin:12vh auto;padding:24px;color:#172033"><h2>${title}</h2><p>${message}</p>${success ? "<p>Você já pode fechar esta página e conectar o Claude ao servidor MCP.</p>" : "<p>Volte à central RSA Digital e confira as configurações.</p>"}</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).send("Método não permitido.");
  try {
    verifyState(req.query?.state);
    if (req.query?.error) throw new Error("O Google cancelou a autorização: " + req.query.error);
    const code = req.query?.code;
    if (!code) throw new Error("O Google não retornou o código de autorização.");
    await exchangeGoogleCode(code, process.env.GOOGLE_REDIRECT_URI);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(page("Google conectado à RSA Digital", "A autorização foi concluída e o token de atualização foi armazenado criptografado.", true));
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(page("Não foi possível conectar", error.message));
  }
}

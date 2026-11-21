import { verifyState, exchangeGoogleCode } from "../../lib/google.js";

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function page(title, message, success = false) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><body style="font:16px system-ui;max-width:680px;margin:12vh auto;padding:24px;color:#172033"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${success ? "<p>Você já pode fechar esta página. No Claude, use list_google_accounts para ver as contas conectadas e os respectivos identificadores.</p>" : "<p>Volte à central RSA Digital e confira as configurações.</p>"}</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).send("Método não permitido.");
  try {
    const state = verifyState(req.query?.state);
    if (req.query?.error) throw new Error("O Google cancelou a autorização: " + req.query.error);
    const code = req.query?.code;
    if (!code) throw new Error("O Google não retornou o código de autorização.");
    const label = state.label || "Conta Google principal";
    await exchangeGoogleCode(code, process.env.GOOGLE_REDIRECT_URI, {
      accountKey: state.accountKey || "primary",
      label
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(page("Conta Google conectada", "A autorização de “" + label + "” foi concluída e o token foi armazenado criptografado.", true));
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(400).send(page("Não foi possível conectar", error.message));
  }
}

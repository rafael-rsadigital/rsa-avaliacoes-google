const ACTIONS = new Set(["BOOK","ORDER","SHOP","LEARN_MORE","SIGN_UP","CALL"]);

function validPublicImageUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
    if (/^(127\\.|10\\.|192\\.168\\.|169\\.254\\.)/.test(host) || /^172\\.(1[6-9]|2[0-9]|3[01])\\./.test(host)) return false;
    return true;
  } catch { return false; }
}

function validHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });

  const token = (req.headers.authorization || "").replace(/^Bearer\\s+/i, "");
  const { locationName, sourceUrl, summary, callToAction } = req.body || {};
  const text = typeof summary === "string" ? summary.trim() : "";

  if (!token) return res.status(401).json({ message: "Conecte sua conta Google novamente." });
  if (!/^accounts\\/[^/]+\\/locations\\/[^/]+$/.test(locationName || "")) return res.status(400).json({ message: "Ficha Google inválida." });
  if (!validPublicImageUrl(sourceUrl || "")) return res.status(400).json({ message: "Informe um link público HTTPS válido para a imagem." });
  if (!text || text.length > 1500) return res.status(400).json({ message: "O texto da atualização deve ter entre 1 e 1.500 caracteres." });

  const post = {
    languageCode: "pt-BR",
    summary: text,
    topicType: "STANDARD",
    media: [{ mediaFormat: "PHOTO", sourceUrl }]
  };

  if (callToAction) {
    if (!ACTIONS.has(callToAction.actionType)) return res.status(400).json({ message: "Tipo de botão inválido." });
    if (callToAction.actionType === "CALL") {
      post.callToAction = { actionType: "CALL" };
    } else {
      if (!validHttpsUrl(callToAction.url || "")) return res.status(400).json({ message: "Informe um link HTTPS válido para o botão." });
      post.callToAction = { actionType: callToAction.actionType, url: callToAction.url };
    }
  }

  try {
    const response = await fetch("https://mybusiness.googleapis.com/v4/" + locationName + "/localPosts", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(post),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ message: data.error?.message || data.message || "O Google não conseguiu criar a atualização." });
    return res.status(200).json({ success: true, post: data, message: "Atualização enviada ao Perfil da Empresa." });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro ao criar atualização." });
  }
}

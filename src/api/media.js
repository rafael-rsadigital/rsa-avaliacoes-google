import { getGoogleAccessToken, safeEqual } from "../lib/google.js";
import { resolveGoogleLocationName } from "../lib/resolve-google-location.js";

const CATEGORIES = new Set(["ADDITIONAL","EXTERIOR","INTERIOR","PRODUCT","AT_WORK","FOOD_AND_DRINK","MENU","COMMON_AREA","ROOMS","TEAMS"]);

function validPublicImageUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
    if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host)) return false;
    return true;
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });

  const accountKey = req.body?.accountKey;
  const bearerToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const { locationName, sourceUrl, category = "ADDITIONAL" } = req.body || {};
  if (accountKey && (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(req.body?.key, process.env.GOOGLE_CONNECT_SECRET))) return res.status(401).json({ message: "Chave administrativa inválida para esta conta Google." });
  if (!accountKey && !bearerToken) return res.status(401).json({ message: "Conecte sua conta Google novamente." });
  if (!/^accounts\/[^/]+\/locations\/[^/]+$/.test(locationName || "") && !/^locations\/[^/]+$/.test(locationName || "")) return res.status(400).json({ message: "Ficha Google inválida." });
  if (!validPublicImageUrl(sourceUrl || "")) return res.status(400).json({ message: "Informe um link público HTTPS válido para a imagem." });
  if (!CATEGORIES.has(category)) return res.status(400).json({ message: "Categoria de foto inválida." });

  try {
    const token = accountKey ? await getGoogleAccessToken(accountKey) : bearerToken;
    const resolvedLocationName = await resolveGoogleLocationName(token, locationName);
    const response = await fetch("https://mybusiness.googleapis.com/v4/" + resolvedLocationName + "/media", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaFormat: "PHOTO",
        locationAssociation: { category },
        sourceUrl
      }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ message: data.error?.message || data.message || "O Google não conseguiu adicionar a foto à galeria." });
    return res.status(200).json({ success: true, media: data, message: "Foto enviada ao Perfil da Empresa." });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro ao publicar foto na galeria." });
  }
}

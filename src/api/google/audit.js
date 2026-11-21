import { getGoogleAccessToken, safeEqual } from "../../lib/google.js";

const BUSINESS_INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });

  const key = typeof req.body?.key === "string" ? req.body.key : "";
  const accountKey = typeof req.body?.accountKey === "string" ? req.body.accountKey : "";
  const locationId = typeof req.body?.locationId === "string" ? req.body.locationId : "";
  if (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(key, process.env.GOOGLE_CONNECT_SECRET)) {
    return res.status(401).json({ message: "Chave de configuração inválida." });
  }
  if (!accountKey || !/^locations\/[A-Za-z0-9_-]+$/.test(locationId)) {
    return res.status(400).json({ message: "Conta ou identificador da ficha inválido." });
  }

  try {
    const token = await getGoogleAccessToken(accountKey);
    const url = new URL(BUSINESS_INFO_API + "/" + locationId);
    url.searchParams.set("readMask", [
      "name", "title", "phoneNumbers", "categories", "storefrontAddress",
      "websiteUri", "regularHours", "profile", "serviceArea", "openInfo", "serviceItems"
    ].join(","));
    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        message: data.error?.message || "O Google não conseguiu retornar os dados desta ficha."
      });
    }
    return res.status(200).json({ location: data });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Não foi possível analisar a ficha." });
  }
}

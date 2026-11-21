import { getGoogleAccessToken, safeEqual } from "../../lib/google.js";

const API = "https://mybusinessbusinessinformation.googleapis.com/v1";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });
  const key = typeof req.body?.key === "string" ? req.body.key : "";
  const accountKey = typeof req.body?.accountKey === "string" ? req.body.accountKey : "";
  const query = typeof req.body?.query === "string" ? req.body.query.trim().slice(0, 80) : "";
  if (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(key, process.env.GOOGLE_CONNECT_SECRET)) {
    return res.status(401).json({ message: "Chave de configuração inválida." });
  }
  if (!accountKey || query.length < 2) return res.status(400).json({ message: "Selecione uma conta e informe ao menos duas letras da categoria." });
  try {
    const token = await getGoogleAccessToken(accountKey);
    const url = new URL(API + "/categories");
    url.searchParams.set("regionCode", "BR");
    url.searchParams.set("languageCode", "pt-BR");
    url.searchParams.set("filter", "displayName=" + query);
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("view", "BASIC");
    const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json({ message: data.error?.message || "Não foi possível consultar as categorias do Google." });
    return res.status(200).json({
      categories: (data.categories || []).map(item => ({
        name: item.name || (item.categoryId ? "categories/" + item.categoryId : ""),
        displayName: item.displayName || item.name || item.categoryId || ""
      })).filter(item => item.name)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Falha ao buscar categorias." });
  }
}

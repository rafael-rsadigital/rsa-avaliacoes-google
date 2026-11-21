import { getGoogleAccessToken, safeEqual } from "../lib/google.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });
  const accountKey = req.body?.accountKey;
  const bearerToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const reviewName = req.body?.reviewName;
  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim() : "";
  if (accountKey && (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(req.body?.key, process.env.GOOGLE_CONNECT_SECRET))) return res.status(401).json({ message: "Chave administrativa inválida para esta conta Google." });
  if (!accountKey && !bearerToken) return res.status(401).json({ message: "Conecte sua conta Google novamente." });
  if (!/^accounts\/[^/]+\/locations\/[^/]+\/reviews\/[^/]+$/.test(reviewName || "")) return res.status(400).json({ message: "Avaliação inválida." });
  if (!comment || comment.length > 4096) return res.status(400).json({ message: "A resposta precisa ter entre 1 e 4096 caracteres." });
  try {
    const token = accountKey ? await getGoogleAccessToken(accountKey) : bearerToken;
    const r = await fetch("https://mybusiness.googleapis.com/v4/" + reviewName + "/reply", {
      method: "PUT",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ comment })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(200).json({ success: true, reply: data });
  } catch (e) { return res.status(500).json({ message: e.message || "Erro ao publicar resposta." }); }
}
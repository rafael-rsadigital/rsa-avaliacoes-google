import { listGoogleOAuthAccounts, getGoogleAccessToken, listGoogleLocations, safeEqual } from "../../lib/google.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Authorization");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });

  const key = req.body && typeof req.body.key === "string" ? req.body.key : "";
  if (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(key, process.env.GOOGLE_CONNECT_SECRET)) {
    return res.status(401).json({ message: "Chave de configuração inválida." });
  }

  try {
    const accounts = await listGoogleOAuthAccounts();
    const result = await Promise.all(accounts.map(async (account) => {
      try {
        const token = await getGoogleAccessToken(account.id);
        const locations = await listGoogleLocations(token);
        return {
          id: account.id,
          label: account.label,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          status: "connected",
          locationCount: locations.length,
          locations: locations.map((location) => ({
            name: location.name,
            title: location.title,
            address: location.address,
            websiteUri: location.websiteUri
          }))
        };
      } catch (error) {
        return {
          id: account.id,
          label: account.label,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          status: "error",
          locationCount: 0,
          locations: [],
          message: error.message || "Não foi possível consultar esta conta."
        };
      }
    }));

    return res.status(200).json({ accounts: result });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Não foi possível consultar as contas Google." });
  }
}

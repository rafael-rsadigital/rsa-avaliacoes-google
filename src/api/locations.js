export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Conecte sua conta Google novamente." });
  try {
    const all = [];
    let pageToken = "";
    do {
      const url = new URL("https://mybusinessbusinessinformation.googleapis.com/v1/accounts/-/locations");
      url.searchParams.set("readMask", "name,title,storefrontAddress,websiteUri");
      url.searchParams.set("pageSize", "100");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const r = await fetch(url, { headers: { Authorization: "Bearer " + token } });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      all.push(...(data.locations || []));
      pageToken = data.nextPageToken || "";
    } while (pageToken);
    return res.status(200).json({ locations: all });
  } catch (e) { return res.status(500).json({ message: e.message || "Erro ao consultar fichas." }); }
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const suppliedLocationName = req.body?.locationName;

  if (!token) return res.status(401).json({ message: "Conecte sua conta Google novamente." });
  if (!suppliedLocationName || typeof suppliedLocationName !== "string") {
    return res.status(400).json({ message: "Ficha inválida." });
  }

  try {
    let locationName = suppliedLocationName;

    // A Business Information API returns locations/{id}, while the Reviews API
    // requires accounts/{accountId}/locations/{locationId}. Resolve the account
    // when the frontend sends the shorter location resource name.
    if (/^locations\/[^/]+$/.test(locationName)) {
      const accountsUrl = new URL("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
      const accounts = [];
      let accountPageToken = "";

      do {
        if (accountPageToken) accountsUrl.searchParams.set("pageToken", accountPageToken);
        const accountResponse = await fetch(accountsUrl, {
          headers: { Authorization: "Bearer " + token }
        });
        const accountData = await accountResponse.json();
        if (!accountResponse.ok) return res.status(accountResponse.status).json(accountData);
        accounts.push(...(accountData.accounts || []));
        accountPageToken = accountData.nextPageToken || "";
      } while (accountPageToken);

      const targetLocationId = locationName.split("/")[1];
      let resolvedName = null;

      for (const account of accounts) {
        if (!account.name) continue;
        const locationsUrl = new URL(
          "https://mybusinessbusinessinformation.googleapis.com/v1/" + account.name + "/locations"
        );
        locationsUrl.searchParams.set("readMask", "name");
        locationsUrl.searchParams.set("pageSize", "100");
        let locationPageToken = "";

        do {
          if (locationPageToken) locationsUrl.searchParams.set("pageToken", locationPageToken);
          const locationsResponse = await fetch(locationsUrl, {
            headers: { Authorization: "Bearer " + token }
          });
          const locationsData = await locationsResponse.json();
          if (!locationsResponse.ok) return res.status(locationsResponse.status).json(locationsData);

          const match = (locationsData.locations || []).find(location =>
            (location.name || "").split("/").pop() === targetLocationId
          );
          if (match) {
            resolvedName = account.name + "/" + match.name;
            break;
          }
          locationPageToken = locationsData.nextPageToken || "";
        } while (locationPageToken);

        if (resolvedName) break;
      }

      if (!resolvedName) return res.status(404).json({ message: "Não foi possível localizar a conta vinculada a esta ficha. Atualize a lista de fichas e tente novamente." });
      locationName = resolvedName;
    }

    if (!/^accounts\/[^/]+\/locations\/[^/]+$/.test(locationName)) {
      return res.status(400).json({ message: "Ficha inválida." });
    }

    const all = [];
    let pageToken = "";
    let averageRating = null;
    let totalReviewCount = null;

    do {
      const url = new URL("https://mybusiness.googleapis.com/v4/" + locationName + "/reviews");
      url.searchParams.set("pageSize", "50");
      url.searchParams.set("orderBy", "updateTime desc");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const response = await fetch(url, {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json(data);

      all.push(...(data.reviews || []));
      averageRating = data.averageRating ?? averageRating;
      totalReviewCount = data.totalReviewCount ?? totalReviewCount;
      pageToken = data.nextPageToken || "";
    } while (pageToken);

    return res.status(200).json({ reviews: all, averageRating, totalReviewCount });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro ao consultar avaliações." });
  }
}

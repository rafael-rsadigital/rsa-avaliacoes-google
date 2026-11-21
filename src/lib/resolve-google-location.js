export async function resolveGoogleLocationName(token, suppliedName) {
  if (typeof suppliedName !== "string" || !suppliedName.trim()) {
    throw new Error("Ficha Google inválida.");
  }

  const value = suppliedName.trim();
  if (/^accounts\/[^/]+\/locations\/[^/]+$/.test(value)) return value;
  if (!/^locations\/[^/]+$/.test(value)) {
    throw new Error("Ficha Google inválida.");
  }

  const targetId = value.split("/")[1];
  const accountsUrl = new URL("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
  let accountPageToken = "";

  do {
    if (accountPageToken) accountsUrl.searchParams.set("pageToken", accountPageToken);
    const accountsResponse = await fetch(accountsUrl, {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store"
    });
    const accountsData = await accountsResponse.json().catch(() => ({}));
    if (!accountsResponse.ok) {
      throw new Error(accountsData.error?.message || "Não foi possível consultar as contas Google.");
    }

    for (const account of accountsData.accounts || []) {
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
          headers: { Authorization: "Bearer " + token },
          cache: "no-store"
        });
        const locationsData = await locationsResponse.json().catch(() => ({}));
        if (!locationsResponse.ok) {
          throw new Error(locationsData.error?.message || "Não foi possível localizar a ficha Google.");
        }

        const match = (locationsData.locations || []).find(location =>
          (location.name || "").split("/").pop() === targetId
        );
        if (match) return account.name + "/" + match.name;
        locationPageToken = locationsData.nextPageToken || "";
      } while (locationPageToken);
    }

    accountPageToken = accountsData.nextPageToken || "";
  } while (accountPageToken);

  throw new Error("Não foi possível localizar a conta vinculada a esta ficha. Atualize a lista de fichas e tente novamente.");
}

import { randomUUID } from "node:crypto";
import { getGoogleAccessToken, safeEqual } from "../../lib/google.js";

const API = "https://mybusinessbusinessinformation.googleapis.com/v1";

function clean(value, max = 500) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const key = clean(body.key, 500);
  if (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(key, process.env.GOOGLE_CONNECT_SECRET)) {
    return res.status(401).json({ message: "Chave de configuração inválida." });
  }

  const accountKey = clean(body.accountKey, 100);
  const parent = clean(body.parentAccountName, 150);
  const title = clean(body.title, 100);
  const categoryName = clean(body.categoryName, 180);
  const street = clean(body.street, 200);
  const city = clean(body.city, 100);
  const state = clean(body.state, 80);
  const postalCode = clean(body.postalCode, 20);
  const phone = clean(body.phone, 40);
  const website = clean(body.website, 300);
  const description = clean(body.description, 750);
  const mode = body.mode === "create" ? "create" : "validate";
  const requestId = /^[0-9a-f-]{36}$/i.test(body.requestId || "") ? body.requestId : randomUUID();

  if (!accountKey || !/^accounts\/[A-Za-z0-9_-]+$/.test(parent)) return res.status(400).json({ message: "Selecione a conta Google responsável pela nova ficha." });
  if (title.length < 2 || !/^categories\/[A-Za-z0-9:_-]+$/.test(categoryName) || !street || !city || !state || !postalCode) {
    return res.status(400).json({ message: "Preencha nome, categoria oficial do Google e endereço completo." });
  }
  if (phone && phone.length < 8) return res.status(400).json({ message: "Confira o telefone informado." });
  if (website) {
    try { if (new URL(website).protocol !== "https:") throw new Error(); }
    catch { return res.status(400).json({ message: "O site deve ser uma URL HTTPS válida." }); }
  }

  try {
    const token = await getGoogleAccessToken(accountKey);
    const accountsResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store"
    });
    const accountsData = await accountsResponse.json().catch(() => ({}));
    if (!accountsResponse.ok) return res.status(accountsResponse.status).json({ message: accountsData.error?.message || "Não foi possível validar a conta comercial." });
    if (!(accountsData.accounts || []).some(account => account.name === parent)) {
      return res.status(403).json({ message: "A conta comercial selecionada não pertence à autorização escolhida." });
    }

    const location = {
      languageCode: "pt-BR",
      title,
      categories: { primaryCategory: { name: categoryName } },
      storefrontAddress: {
        regionCode: "BR",
        languageCode: "pt-BR",
        addressLines: [street],
        locality: city,
        administrativeArea: state,
        postalCode
      }
    };
    if (phone) location.phoneNumbers = { primaryPhone: phone };
    if (website) location.websiteUri = website;
    if (description) location.profile = { description };

    const url = new URL(API + "/" + parent + "/locations");
    url.searchParams.set("requestId", requestId);
    if (mode === "validate") url.searchParams.set("validateOnly", "true");
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(location),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        message: data.error?.message || "O Google recusou os dados da nova ficha.",
        details: data.error?.details || []
      });
    }
    return res.status(200).json({
      validated: mode === "validate",
      created: mode === "create",
      requestId,
      location: data,
      message: mode === "validate"
        ? "Os dados passaram pela validação da API. Revise e confirme para enviar a criação."
        : "A solicitação de criação foi enviada ao Google. A ficha ainda pode precisar de verificação antes de aparecer publicamente."
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Não foi possível processar a criação da ficha." });
  }
}

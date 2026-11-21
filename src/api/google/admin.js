import { randomUUID } from "node:crypto";
import {
  listGoogleOAuthAccounts,
  getGoogleAccessToken,
  listGoogleLocations,
  safeEqual
} from "../../lib/google.js";

const BUSINESS_INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const PERFORMANCE_API = "https://businessprofileperformance.googleapis.com/v1";
const METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "MESSAGING_CLICKS"
];

function clean(value, max = 500) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";
}
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function setDateParams(url, prefix, value) {
  const [year, month, day] = value.split("-").map(Number);
  url.searchParams.set(prefix + ".year", String(year));
  url.searchParams.set(prefix + ".month", String(month));
  url.searchParams.set(prefix + ".day", String(day));
}

async function listAccounts() {
  const accounts = await listGoogleOAuthAccounts();
  return Promise.all(accounts.map(async account => {
    try {
      const token = await getGoogleAccessToken(account.id);
      const [locations, googleAccounts] = await Promise.all([
        listGoogleLocations(token),
        (async () => {
          const collected = [];
          let pageToken = "";
          do {
            const url = new URL("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
            if (pageToken) url.searchParams.set("pageToken", pageToken);
            const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error?.message || "Não foi possível listar as contas comerciais.");
            collected.push(...(data.accounts || []));
            pageToken = data.nextPageToken || "";
          } while (pageToken);
          return collected;
        })()
      ]);
      return {
        id: account.id, label: account.label, createdAt: account.createdAt, updatedAt: account.updatedAt,
        status: "connected", locationCount: locations.length,
        googleAccounts: googleAccounts.map(item => ({
          name: item.name, accountName: item.accountName || "", type: item.type || "", role: item.role || ""
        })),
        locations: locations.map(location => ({
          name: location.name, locationId: location.locationId, accountName: location.accountName,
          title: location.title, address: location.address, websiteUri: location.websiteUri
        }))
      };
    } catch (error) {
      return {
        id: account.id, label: account.label, createdAt: account.createdAt, updatedAt: account.updatedAt,
        status: "error", locationCount: 0, googleAccounts: [], locations: [],
        message: error.message || "Não foi possível consultar esta conta."
      };
    }
  }));
}

async function auditLocation(body) {
  const accountKey = clean(body.accountKey, 100);
  const locationId = clean(body.locationId, 100);
  if (!accountKey || !/^locations\/[A-Za-z0-9_-]+$/.test(locationId)) {
    return { status: 400, data: { message: "Conta ou identificador da ficha inválido." } };
  }
  const token = await getGoogleAccessToken(accountKey);
  const url = new URL(BUSINESS_INFO_API + "/" + locationId);
  url.searchParams.set("readMask", [
    "name", "title", "phoneNumbers", "categories", "storefrontAddress",
    "websiteUri", "regularHours", "profile", "serviceArea", "openInfo", "serviceItems"
  ].join(","));
  const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: response.status, data: { message: data.error?.message || "O Google não conseguiu retornar os dados desta ficha." } };
  return { status: 200, data: { location: data } };
}

async function performance(body) {
  const accountKey = clean(body.accountKey, 100);
  const locationId = clean(body.locationId, 100);
  const startDate = body.startDate;
  const endDate = body.endDate;
  if (!accountKey || !/^locations\/[A-Za-z0-9_-]+$/.test(locationId) || !validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    return { status: 400, data: { message: "Conta, ficha ou período inválido." } };
  }
  const token = await getGoogleAccessToken(accountKey);
  const metrics = await Promise.all(METRICS.map(async metric => {
    const url = new URL(PERFORMANCE_API + "/" + locationId + ":getDailyMetricsTimeSeries");
    url.searchParams.set("dailyMetric", metric);
    setDateParams(url, "dailyRange.start_date", startDate);
    setDateParams(url, "dailyRange.end_date", endDate);
    const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { metric, values: [], error: data.error?.message || "Métrica indisponível (" + response.status + ")." };
    return {
      metric,
      values: (data.timeSeries?.datedValues || []).map(item => ({
        date: item.date ? [item.date.year, String(item.date.month).padStart(2, "0"), String(item.date.day).padStart(2, "0")].join("-") : null,
        value: Number(item.value || 0)
      })).filter(item => item.date)
    };
  }));
  return { status: 200, data: { locationId, startDate, endDate, metrics } };
}

async function searchKeywords(body) {
  const accountKey = clean(body.accountKey, 100);
  const locationId = clean(body.locationId, 100);
  const startDate = body.startDate;
  const endDate = body.endDate;
  if (!accountKey || !/^locations\/[A-Za-z0-9_-]+$/.test(locationId) || !validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    return { status: 400, data: { message: "Conta, ficha ou período inválido para palavras-chave." } };
  }
  const token = await getGoogleAccessToken(accountKey);
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const url = new URL(PERFORMANCE_API + "/" + locationId + "/searchkeywords/impressions/monthly");
  url.searchParams.set("monthly_range.start_month.year", String(startYear));
  url.searchParams.set("monthly_range.start_month.month", String(startMonth));
  url.searchParams.set("monthly_range.end_month.year", String(endYear));
  url.searchParams.set("monthly_range.end_month.month", String(endMonth));
  url.searchParams.set("pageSize", "100");
  const keywords = [];
  let pageToken = "";
  try {
    do {
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error?.message || "Não foi possível consultar palavras-chave (" + response.status + ").");
      (data.searchKeywordsCounts || []).forEach(item => {
        const insight = item.insightsValue || {};
        keywords.push({
          keyword: item.searchKeyword || "",
          value: insight.value != null ? Number(insight.value) : null,
          threshold: insight.threshold != null ? Number(insight.threshold) : null
        });
      });
      pageToken = data.nextPageToken || "";
    } while (pageToken);
    keywords.sort((a, b) => (b.value ?? b.threshold ?? 0) - (a.value ?? a.threshold ?? 0));
    return { status: 200, data: { startMonth: startYear + "-" + String(startMonth).padStart(2, "0"), endMonth: endYear + "-" + String(endMonth).padStart(2, "0"), keywords } };
  } catch (error) {
    return { status: 200, data: { keywords: [], error: error.message || "Palavras-chave indisponíveis." } };
  }
}

async function categories(body) {
  const accountKey = clean(body.accountKey, 100);
  const query = clean(body.query, 80);
  if (!accountKey || query.length < 2) return { status: 400, data: { message: "Selecione uma conta e informe ao menos duas letras da categoria." } };
  const token = await getGoogleAccessToken(accountKey);
  const url = new URL(BUSINESS_INFO_API + "/categories");
  url.searchParams.set("regionCode", "BR");
  url.searchParams.set("languageCode", "pt-BR");
  url.searchParams.set("filter", "displayName=" + query);
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("view", "BASIC");
  const response = await fetch(url, { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: response.status, data: { message: data.error?.message || "Não foi possível consultar as categorias do Google." } };
  return {
    status: 200,
    data: {
      categories: (data.categories || []).map(item => ({
        name: item.name || (item.categoryId ? "categories/" + item.categoryId : ""),
        displayName: item.displayName || item.name || item.categoryId || ""
      })).filter(item => item.name)
    }
  };
}

async function createLocation(body) {
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
  const businessType = body.businessType === "CUSTOMER_LOCATION_ONLY" ? "CUSTOMER_LOCATION_ONLY" : body.businessType === "CUSTOMER_AND_BUSINESS_LOCATION" ? "CUSTOMER_AND_BUSINESS_LOCATION" : "STORE_FRONT";
  const serviceAreaPlaceIds = Array.isArray(body.serviceAreaPlaceIds) ? body.serviceAreaPlaceIds.map(value => clean(value, 300)).filter(value => /^[A-Za-z0-9_-]{5,300}$/.test(value)).slice(0, 20) : [];
  const mode = body.mode === "create" ? "create" : "validate";
  const requestId = /^[0-9a-f-]{36}$/i.test(body.requestId || "") ? body.requestId : randomUUID();

  if (!accountKey || !/^accounts\/[A-Za-z0-9_-]+$/.test(parent)) return { status: 400, data: { message: "Selecione a conta Google responsável pela nova ficha." } };
  if (title.length < 2 || !/^categories\/[A-Za-z0-9:_-]+$/.test(categoryName) || !street || !city || !state || !postalCode) {
    return { status: 400, data: { message: "Preencha nome, categoria oficial do Google e endereço completo." } };
  }
  if (phone && phone.length < 8) return { status: 400, data: { message: "Confira o telefone informado." } };
  if (website) {
    try { if (new URL(website).protocol !== "https:") throw new Error(); }
    catch { return { status: 400, data: { message: "O site deve ser uma URL HTTPS válida." } }; }
  }

  const token = await getGoogleAccessToken(accountKey);
  const availableAccounts = [];
  let accountPageToken = "";
  do {
    const accountsUrl = new URL("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
    if (accountPageToken) accountsUrl.searchParams.set("pageToken", accountPageToken);
    const accountsResponse = await fetch(accountsUrl, {
      headers: { Authorization: "Bearer " + token }, cache: "no-store"
    });
    const accountsData = await accountsResponse.json().catch(() => ({}));
    if (!accountsResponse.ok) return { status: accountsResponse.status, data: { message: accountsData.error?.message || "Não foi possível validar a conta comercial." } };
    availableAccounts.push(...(accountsData.accounts || []));
    accountPageToken = accountsData.nextPageToken || "";
  } while (accountPageToken);
  if (!availableAccounts.some(account => account.name === parent)) {
    return { status: 403, data: { message: "A conta comercial selecionada não pertence à autorização escolhida." } };
  }

  const location = {
    languageCode: "pt-BR",
    title,
    categories: { primaryCategory: { name: categoryName } }
  };
  if (!serviceOnly) {
    location.storefrontAddress = {
      regionCode: "BR", languageCode: "pt-BR", addressLines: [street],
      locality: city, administrativeArea: state, postalCode
    };
  }
  if (hasServiceArea) {
    location.serviceArea = {
      businessType,
      regionCode: "BR",
      places: { placeInfos: serviceAreaPlaceIds.map(placeId => ({ placeId })) }
    };
  }
  if (phone) location.phoneNumbers = { primaryPhone: phone };
  if (website) location.websiteUri = website;
  if (description) location.profile = { description };

  const url = new URL(BUSINESS_INFO_API + "/" + parent + "/locations");
  url.searchParams.set("requestId", requestId);
  if (mode === "validate") url.searchParams.set("validateOnly", "true");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(location),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: response.status, data: { message: data.error?.message || "O Google recusou os dados da nova ficha.", details: data.error?.details || [] } };
  return {
    status: 200,
    data: {
      validated: mode === "validate", created: mode === "create", requestId, location: data,
      message: mode === "validate"
        ? "Os dados passaram pela validação da API. Revise e confirme para enviar a criação."
        : "A solicitação de criação foi enviada ao Google. A ficha ainda pode precisar de verificação antes de aparecer publicamente."
    }
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const key = typeof body.key === "string" ? body.key : "";
  if (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(key, process.env.GOOGLE_CONNECT_SECRET)) {
    return res.status(401).json({ message: "Chave de configuração inválida." });
  }
  try {
    let result;
    switch (body.action) {
      case "accounts":
        result = { status: 200, data: { accounts: await listAccounts() } };
        break;
      case "audit":
        result = await auditLocation(body);
        break;
      case "performance":
        result = await performance(body);
        break;
      case "categories":
        result = await categories(body);
        break;
      case "create-location":
        result = await createLocation(body);
        break;
      default:
        return res.status(400).json({ message: "Ação administrativa inválida." });
    }
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Erro ao executar a operação administrativa." });
  }
}

import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API = "https://mybusiness.googleapis.com/v4";
const BUSINESS_INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error("Configuração ausente no servidor: " + name);
  return value;
}

function encryptionKey() {
  const key = Buffer.from(required("TOKEN_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY precisa ser uma chave base64 de 32 bytes.");
  return key;
}

export function encryptSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSecret(value) {
  const [ivPart, tagPart, dataPart] = String(value || "").split(".");
  if (!ivPart || !tagPart || !dataPart) throw new Error("Token armazenado em formato inválido.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function signState(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", required("OAUTH_STATE_SECRET")).update(body).digest("base64url");
  return body + "." + signature;
}

export function verifyState(state) {
  const [body, signature] = String(state || "").split(".");
  if (!body || !signature) throw new Error("Estado OAuth inválido.");
  const expected = createHmac("sha256", required("OAUTH_STATE_SECRET")).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Assinatura do estado OAuth inválida.");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Date.now()) throw new Error("A autorização expirou. Inicie a conexão novamente.");
  return payload;
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

async function supabaseRequest(path, options = {}) {
  const base = required("SUPABASE_URL").replace(/\/$/, "");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(base + "/rest/v1/" + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store"
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = [data?.message, data?.hint, data?.details].filter(Boolean).join(" — ");
    throw new Error(detail || data?.error_description || "Falha ao acessar o armazenamento seguro.");
  }
  return data;
}

export async function listGoogleOAuthAccounts() {
  const rows = await supabaseRequest(
    "google_oauth_accounts?select=id,label,created_at,updated_at&order=created_at.asc",
    { method: "GET" }
  );
  return (rows || []).map((row) => ({
    id: row.id,
    label: row.label,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function saveRefreshToken(refreshToken, accountKey = "primary", label = "Conta Google principal") {
  const encrypted = encryptSecret(refreshToken);
  await supabaseRequest("google_oauth_accounts?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: accountKey,
      label,
      encrypted_refresh_token: encrypted,
      updated_at: new Date().toISOString()
    })
  });
}

async function loadRefreshToken(accountKey) {
  const rows = await supabaseRequest(
    "google_oauth_accounts?id=eq." + encodeURIComponent(accountKey) + "&select=encrypted_refresh_token",
    { method: "GET" }
  );
  if (rows?.length) return decryptSecret(rows[0].encrypted_refresh_token);

  // Compatibilidade e recuperação: mantém leitura da tabela antiga para a conta principal.
  if (accountKey === "primary") {
    const legacyRows = await supabaseRequest(
      "google_oauth_tokens?id=eq.primary&select=encrypted_refresh_token",
      { method: "GET" }
    );
    if (legacyRows?.length) return decryptSecret(legacyRows[0].encrypted_refresh_token);
  }
  throw new Error("Conta Google não encontrada. Use list_google_accounts para consultar as contas conectadas.");
}

async function resolveGoogleAccountKey(accountKey) {
  if (accountKey) {
    const accounts = await listGoogleOAuthAccounts();
    if (!accounts.some((account) => account.id === accountKey)) {
      throw new Error("Conta Google não encontrada. Use list_google_accounts para consultar as contas conectadas.");
    }
    return accountKey;
  }

  const accounts = await listGoogleOAuthAccounts();
  if (!accounts.length) throw new Error("Nenhuma conta Google conectada. Abra /api/google/connect para autorizar.");
  if (accounts.some((account) => account.id === "primary")) return "primary";
  if (accounts.length === 1) return accounts[0].id;
  throw new Error("Há várias contas Google conectadas. Informe o accountKey retornado por list_google_accounts.");
}

export async function exchangeGoogleCode(code, redirectUri, account = {}) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Não foi possível concluir a autorização Google.");
  if (!data.refresh_token) throw new Error("O Google não retornou refresh token. Revogue o acesso anterior do app RSA Digital e tente conectar novamente com consentimento.");
  await saveRefreshToken(
    data.refresh_token,
    account.accountKey || "primary",
    account.label || "Conta Google principal"
  );
}

export async function getGoogleAccessToken(accountKey) {
  const resolvedKey = await resolveGoogleAccountKey(accountKey);
  const refreshToken = await loadRefreshToken(resolvedKey);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: required("GOOGLE_CLIENT_ID"),
      client_secret: required("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Não foi possível renovar a autorização Google.");
  return data.access_token;
}

async function googleGet(url, token) {
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || data.message || "Erro na API Google (" + response.status + ").");
  return data;
}

async function googlePost(url, token, body, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || data.message || "Erro na API Google (" + response.status + ").");
  return data;
}

export async function listGoogleLocations(token) {
  const accounts = [];
  let accountPageToken = "";
  do {
    const url = new URL(ACCOUNT_API + "/accounts");
    if (accountPageToken) url.searchParams.set("pageToken", accountPageToken);
    const page = await googleGet(url, token);
    accounts.push(...(page.accounts || []));
    accountPageToken = page.nextPageToken || "";
  } while (accountPageToken);

  const locations = [];
  for (const account of accounts) {
    if (!account.name) continue;
    let pageToken = "";
    do {
      const url = new URL(BUSINESS_INFO_API + "/" + account.name + "/locations");
      url.searchParams.set("readMask", "name,title,storefrontAddress,websiteUri");
      url.searchParams.set("pageSize", "100");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const page = await googleGet(url, token);
      for (const location of page.locations || []) {
        locations.push({
          name: account.name + "/" + location.name,
          locationId: location.name,
          accountName: account.name,
          title: location.title || "Empresa sem nome",
          address: location.storefrontAddress || null,
          websiteUri: location.websiteUri || null
        });
      }
      pageToken = page.nextPageToken || "";
    } while (pageToken);
  }
  return locations;
}

export async function listGoogleReviews(token, location, pendingOnly = true) {
  const all = [];
  let pageToken = "";
  do {
    const url = new URL(GOOGLE_API + "/" + location.name + "/reviews");
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("orderBy", "updateTime desc");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await googleGet(url, token);
    for (const review of page.reviews || []) {
      if (pendingOnly && review.reviewReply?.comment) continue;
      all.push({
        name: review.name,
        locationName: location.name,
        businessName: location.title,
        reviewer: review.reviewer?.displayName || "Cliente do Google",
        starRating: review.starRating || null,
        comment: review.comment || "",
        createTime: review.createTime || null,
        updateTime: review.updateTime || null,
        hasReply: Boolean(review.reviewReply?.comment)
      });
    }
    pageToken = page.nextPageToken || "";
  } while (pageToken);
  return all;
}

export async function publishGoogleReply(token, reviewName, comment) {
  const current = await googleGet(GOOGLE_API + "/" + reviewName, token);
  if (current.reviewReply?.comment) {
    return { reviewName, status: "skipped_already_answered", message: "A avaliação já possui resposta." };
  }
  await googlePost(GOOGLE_API + "/" + reviewName + "/reply", token, { comment }, "PUT");
  return { reviewName, status: "published" };
}

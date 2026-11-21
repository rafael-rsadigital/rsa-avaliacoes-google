import {
  getGoogleAccessToken,
  listGoogleOAuthAccounts,
  listGoogleLocations,
  listGoogleReviews,
  publishGoogleReply,
  safeEqual
} from "../lib/google.js";

const SERVER = { name: "rsa-digital-avaliacoes", version: "1.1.0" };

const TOOLS = [
  {
    name: "list_google_accounts",
    description: "Lista as contas Google autorizadas na RSA Digital. Retorna accountKey e label; use o accountKey para consultar as fichas de uma conta específica.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "list_locations",
    description: "Lista as fichas acessíveis por todas as contas Google conectadas. Cada ficha inclui accountKey e accountLabel; use esses campos para consultar avaliações e publicar respostas na conta correta. Opcionalmente filtre por accountKey.",
    inputSchema: {
      type: "object",
      properties: {
        accountKey: { type: "string", description: "Opcional: identificador retornado por list_google_accounts. Sem este campo, lista fichas de todas as contas conectadas." }
      },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "list_unanswered_reviews",
    description: "Consulta avaliações sem resposta em todas as contas Google conectadas ou em uma conta específica. Retorna accountKey junto de cada avaliação; preserve esse identificador ao solicitar a publicação das respostas.",
    inputSchema: {
      type: "object",
      properties: {
        accountKey: { type: "string", description: "Opcional: identificador retornado por list_google_accounts. Sem este campo, consulta todas as contas." },
        locationName: { type: "string", description: "Opcional: recurso completo da ficha retornado por list_locations." },
        maxResults: { type: "integer", minimum: 1, maximum: 300, default: 200 }
      },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "publish_replies",
    description: "PUBLICA respostas no Google. Só chame depois que o usuário aprovar explicitamente o lote e o conteúdo exato. Cada item contém reviewName, comment e accountKey retornado pela consulta. Se accountKey for omitido, usa a conta principal (ou a única conta conectada). Revalida cada avaliação antes de publicar e pula as que já receberam resposta. Máximo de 25 respostas por chamada.",
    inputSchema: {
      type: "object",
      properties: {
        replies: {
          type: "array",
          minItems: 1,
          maxItems: 25,
          items: {
            type: "object",
            properties: {
              reviewName: { type: "string", description: "Identificador completo da avaliação retornado pelo Google." },
              comment: { type: "string", minLength: 1, maxLength: 4096 },
              accountKey: { type: "string", description: "Identificador da conta Google retornado junto da avaliação. Necessário para selecionar a conta correta quando houver mais de uma." }
            },
            required: ["reviewName", "comment"],
            additionalProperties: false
          }
        }
      },
      required: ["replies"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true }
  }
];

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolResult(value, isError = false) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], isError };
}

async function selectedAccounts(accountKey) {
  const accounts = await listGoogleOAuthAccounts();
  if (!accounts.length) throw new Error("Nenhuma conta Google conectada. Abra /api/google/connect para autorizar.");
  if (!accountKey) return accounts;
  const selected = accounts.filter((account) => account.id === accountKey);
  if (!selected.length) throw new Error("Conta Google não encontrada. Use list_google_accounts para consultar os identificadores.");
  return selected;
}

async function callTool(name, args) {
  if (name === "list_google_accounts") {
    const accounts = await listGoogleOAuthAccounts();
    return toolResult({
      count: accounts.length,
      accounts: accounts.map((account) => ({
        accountKey: account.id,
        label: account.label,
        connectedAt: account.createdAt
      }))
    });
  }

  if (name === "list_locations") {
    const accounts = await selectedAccounts(args.accountKey);
    const locations = [];
    for (const account of accounts) {
      const token = await getGoogleAccessToken(account.id);
      const accountLocations = await listGoogleLocations(token);
      locations.push(...accountLocations.map((location) => ({
        ...location,
        accountKey: account.id,
        accountLabel: account.label
      })));
    }
    return toolResult({ count: locations.length, accountsChecked: accounts.length, locations });
  }

  if (name === "list_unanswered_reviews") {
    const accounts = await selectedAccounts(args.accountKey);
    const maxResults = Math.min(Math.max(Number(args.maxResults) || 200, 1), 300);
    const reviews = [];
    let locationsChecked = 0;

    for (const account of accounts) {
      if (reviews.length >= maxResults) break;
      const token = await getGoogleAccessToken(account.id);
      const locations = await listGoogleLocations(token);
      const target = args.locationName
        ? locations.filter((location) => location.name === args.locationName)
        : locations;
      if (args.locationName && !target.length) continue;
      locationsChecked += target.length;

      for (const location of target) {
        if (reviews.length >= maxResults) break;
        const pending = await listGoogleReviews(token, location, true);
        reviews.push(...pending.slice(0, maxResults - reviews.length).map((review) => ({
          ...review,
          accountKey: account.id,
          accountLabel: account.label
        })));
      }
    }

    if (args.locationName && !locationsChecked) {
      throw new Error("A ficha informada não foi encontrada nas contas selecionadas. Atualize list_locations e preserve o accountKey.");
    }
    return toolResult({
      count: reviews.length,
      accountsChecked: accounts.length,
      locationsChecked,
      truncated: reviews.length >= maxResults,
      reviews
    });
  }

  if (name === "publish_replies") {
    if (!Array.isArray(args.replies) || args.replies.length < 1 || args.replies.length > 25) {
      throw new Error("Envie de 1 a 25 respostas por lote.");
    }
    const results = [];
    for (const item of args.replies) {
      if (!/^accounts\/[^/]+\/locations\/[^/]+\/reviews\/[^/]+$/.test(item.reviewName || "")) {
        results.push({ reviewName: item.reviewName || null, status: "error", message: "Identificador de avaliação inválido." });
        continue;
      }
      const comment = typeof item.comment === "string" ? item.comment.trim() : "";
      if (!comment || comment.length > 4096) {
        results.push({ reviewName: item.reviewName, status: "error", message: "Resposta vazia ou maior que 4096 caracteres." });
        continue;
      }
      try {
        const token = await getGoogleAccessToken(item.accountKey || undefined);
        results.push({
          ...(await publishGoogleReply(token, item.reviewName, comment)),
          accountKey: item.accountKey || null
        });
      } catch (error) {
        results.push({
          reviewName: item.reviewName,
          accountKey: item.accountKey || null,
          status: "error",
          message: error.message
        });
      }
    }
    return toolResult({
      total: results.length,
      published: results.filter((result) => result.status === "published").length,
      skipped: results.filter((result) => result.status === "skipped_already_answered").length,
      failed: results.filter((result) => result.status === "error").length,
      results
    });
  }

  throw new Error("Ferramenta desconhecida: " + name);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") return json(res, 200, { name: SERVER.name, status: "online", endpoint: "/api/mcp", protocol: "MCP Streamable HTTP" });
  if (req.method !== "POST") return res.status(405).send("Método não permitido.");

  const expected = process.env.MCP_API_KEY;
  const authorization = req.headers.authorization || "";
  const supplied = authorization.replace(/^Bearer\s+/i, "");
  if (!expected || !safeEqual(supplied, expected)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="RSA Digital MCP"');
    return json(res, 401, { error: "Não autorizado." });
  }

  const message = req.body;
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return json(res, 400, rpcError(message?.id ?? null, -32600, "Requisição JSON-RPC inválida."));
  }
  if (message.method.startsWith("notifications/")) return res.status(202).end();

  if (message.method === "initialize") {
    return json(res, 200, {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion: message.params?.protocolVersion || "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: SERVER
      }
    });
  }
  if (message.method === "ping") return json(res, 200, { jsonrpc: "2.0", id: message.id, result: {} });
  if (message.method === "tools/list") {
    return json(res, 200, { jsonrpc: "2.0", id: message.id, result: { tools: TOOLS } });
  }
  if (message.method === "tools/call") {
    try {
      const result = await callTool(message.params?.name, message.params?.arguments || {});
      return json(res, 200, { jsonrpc: "2.0", id: message.id, result });
    } catch (error) {
      return json(res, 200, { jsonrpc: "2.0", id: message.id, result: toolResult({ error: error.message }, true) });
    }
  }
  return json(res, 200, rpcError(message.id ?? null, -32601, "Método não encontrado."));
}

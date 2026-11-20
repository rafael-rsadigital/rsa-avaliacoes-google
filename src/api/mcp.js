import { getGoogleAccessToken, listGoogleLocations, listGoogleReviews, publishGoogleReply, safeEqual } from "../lib/google.js";

const SERVER = { name: "rsa-digital-avaliacoes", version: "1.0.0" };

const TOOLS = [
  {
    name: "list_locations",
    description: "Lista todas as fichas do Perfil da Empresa Google acessíveis pela conta RSA Digital conectada. Use para identificar todas as empresas gerenciadas.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "list_unanswered_reviews",
    description: "Consulta avaliações sem resposta em todas as fichas Google conectadas. Pode filtrar por locationName retornado por list_locations. Retorna nome da empresa, autor, estrelas, comentário, data e reviewName necessário para responder.",
    inputSchema: {
      type: "object",
      properties: {
        locationName: { type: "string", description: "Opcional: recurso completo da ficha retornado por list_locations." },
        maxResults: { type: "integer", minimum: 1, maximum: 300, default: 200 }
      },
      additionalProperties: false
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "publish_replies",
    description: "PUBLICA respostas no Google. Só chame esta ferramenta depois que o usuário tiver aprovado explicitamente o lote de respostas e o conteúdo exato. Cada item contém reviewName e comment. Publica em sequência, verifica novamente se a avaliação continua sem resposta e pula as que já foram respondidas. Máximo de 25 respostas por chamada.",
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
              comment: { type: "string", minLength: 1, maxLength: 4096 }
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

async function callTool(name, args) {
  const token = await getGoogleAccessToken();
  if (name === "list_locations") {
    const locations = await listGoogleLocations(token);
    return toolResult({ count: locations.length, locations });
  }
  if (name === "list_unanswered_reviews") {
    const locations = await listGoogleLocations(token);
    const target = args.locationName ? locations.filter((location) => location.name === args.locationName) : locations;
    if (args.locationName && !target.length) throw new Error("A ficha informada não foi encontrada entre as fichas conectadas.");
    const maxResults = Math.min(Math.max(Number(args.maxResults) || 200, 1), 300);
    const reviews = [];
    for (const location of target) {
      if (reviews.length >= maxResults) break;
      const pending = await listGoogleReviews(token, location, true);
      reviews.push(...pending.slice(0, maxResults - reviews.length));
    }
    return toolResult({ count: reviews.length, locationsChecked: target.length, truncated: reviews.length >= maxResults, reviews });
  }
  if (name === "publish_replies") {
    if (!Array.isArray(args.replies) || args.replies.length < 1 || args.replies.length > 25) throw new Error("Envie de 1 a 25 respostas por lote.");
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
        results.push(await publishGoogleReply(token, item.reviewName, comment));
      } catch (error) {
        results.push({ reviewName: item.reviewName, status: "error", message: error.message });
      }
    }
    return toolResult({ total: results.length, published: results.filter((r) => r.status === "published").length, skipped: results.filter((r) => r.status === "skipped_already_answered").length, failed: results.filter((r) => r.status === "error").length, results });
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

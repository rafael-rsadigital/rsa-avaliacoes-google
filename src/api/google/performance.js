import { getGoogleAccessToken, safeEqual } from "../../lib/google.js";

const PERFORMANCE_API = "https://businessprofileperformance.googleapis.com/v1";
const METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS"
];

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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ message: "Método não permitido." });
  const key = typeof req.body?.key === "string" ? req.body.key : "";
  const accountKey = typeof req.body?.accountKey === "string" ? req.body.accountKey : "";
  const locationId = typeof req.body?.locationId === "string" ? req.body.locationId : "";
  const startDate = req.body?.startDate;
  const endDate = req.body?.endDate;

  if (!process.env.GOOGLE_CONNECT_SECRET || !safeEqual(key, process.env.GOOGLE_CONNECT_SECRET)) {
    return res.status(401).json({ message: "Chave de configuração inválida." });
  }
  if (!accountKey || !/^locations\/[A-Za-z0-9_-]+$/.test(locationId) || !validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    return res.status(400).json({ message: "Conta, ficha ou período inválido." });
  }

  try {
    const token = await getGoogleAccessToken(accountKey);
    const results = await Promise.all(METRICS.map(async (metric) => {
      const url = new URL(PERFORMANCE_API + "/" + locationId + ":getDailyMetricsTimeSeries");
      url.searchParams.set("dailyMetric", metric);
      setDateParams(url, "dailyRange.start_date", startDate);
      setDateParams(url, "dailyRange.end_date", endDate);
      const response = await fetch(url, {
        headers: { Authorization: "Bearer " + token },
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { metric, values: [], error: data.error?.message || "Métrica indisponível (" + response.status + ")." };
      }
      const values = data.timeSeries?.datedValues || [];
      return {
        metric,
        values: values.map(item => ({
          date: item.date ? [item.date.year, String(item.date.month).padStart(2, "0"), String(item.date.day).padStart(2, "0")].join("-") : null,
          value: Number(item.value || 0)
        })).filter(item => item.date)
      };
    }));
    return res.status(200).json({ locationId, startDate, endDate, metrics: results });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Não foi possível consultar o desempenho da ficha." });
  }
}

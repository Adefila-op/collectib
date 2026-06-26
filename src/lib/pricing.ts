const REGION_TO_CURRENCY: Record<string, string> = {
  AE: "AED",
  AU: "AUD",
  CA: "CAD",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  GH: "GHS",
  IE: "EUR",
  IT: "EUR",
  KE: "KES",
  NG: "NGN",
  NL: "EUR",
  PT: "EUR",
  US: "USD",
  ZA: "ZAR",
};

const USD_TO_CURRENCY_RATE: Record<string, number> = {
  AED: 3.67,
  AUD: 1.53,
  CAD: 1.37,
  EUR: 0.93,
  GBP: 0.79,
  GHS: 12.2,
  KES: 129,
  NGN: 1550,
  USD: 1,
  ZAR: 18.2,
};

const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  "Africa/Accra": "GHS",
  "Africa/Johannesburg": "ZAR",
  "Africa/Lagos": "NGN",
  "Africa/Nairobi": "KES",
  "Australia/Sydney": "AUD",
  "America/Toronto": "CAD",
  "Europe/Dublin": "EUR",
  "Europe/London": "GBP",
  "Europe/Madrid": "EUR",
  "Europe/Paris": "EUR",
};

const CRYPTO_CURRENCIES = new Set(["SOL", "USDC"]);

export function formatLocalPrice(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  if (CRYPTO_CURRENCIES.has(currency)) return `${value.toLocaleString()} ${currency}`;

  const localCurrency = getLocalCurrency();
  const converted = currency === "USD" ? value * (USD_TO_CURRENCY_RATE[localCurrency] ?? 1) : value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency === "USD" ? localCurrency : currency,
    maximumFractionDigits: converted >= 1000 ? 0 : 2,
  }).format(converted);
}

function getLocalCurrency() {
  if (typeof navigator === "undefined") return "USD";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timeZone && TIMEZONE_TO_CURRENCY[timeZone]) return TIMEZONE_TO_CURRENCY[timeZone];

  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const region = getRegion(locale);
    if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
  }
  return "USD";
}

function getRegion(locale: string) {
  try {
    return new Intl.Locale(locale).region?.toUpperCase();
  } catch {
    const region = locale.split("-")[1];
    return region?.toUpperCase();
  }
}

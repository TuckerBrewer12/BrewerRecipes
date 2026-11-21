
const UNICODE_FRACTIONS: Record<string, number> = {
  "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875, "⅕": 0.2, "⅙": 1 / 6,
};

export function parseQuantity(input: string | null | undefined): number | null {
  if (!input) return null;
  let s = input.trim();
  if (!s) return null;
  s = s.replace(/(\d)([¼½¾⅓⅔⅛⅜⅝⅞⅕⅙])/g, "$1 $2");
  let total = 0;
  for (const part of s.split(/\s+/)) {
    if (part in UNICODE_FRACTIONS) total += UNICODE_FRACTIONS[part];
    else if (/^\d+\/\d+$/.test(part)) {
      const [n, d] = part.split("/").map(Number);
      if (!d) return null;
      total += n / d;
    } else if (/^\d+(\.\d+)?$/.test(part)) total += Number(part);
    else return null;
  }
  return total > 0 ? total : null;
}

const NICE_FRACTIONS: [number, string][] = [
  [0, ""], [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"],
  [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"], [1, ""],
];

export function formatQuantity(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  let best = NICE_FRACTIONS[0];
  for (const f of NICE_FRACTIONS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  if (Math.abs(best[0] - frac) > 0.04) {
    return String(Math.round(n * 10) / 10);
  }
  const w = best[0] === 1 ? whole + 1 : whole;
  if (!best[1]) return String(w);
  return w > 0 ? `${w}${best[1]}` : best[1];
}

type MetricUnit = { to: "ml" | "g"; factor: number };
const TO_METRIC: Record<string, MetricUnit> = {};
function alias(names: string[], m: MetricUnit) {
  for (const n of names) TO_METRIC[n] = m;
}
alias(["tsp", "tsp.", "teaspoon", "teaspoons", "t"], { to: "ml", factor: 4.929 });
alias(["tbsp", "tbsp.", "tbs", "tbs.", "tablespoon", "tablespoons", "T"], { to: "ml", factor: 14.787 });
alias(["cup", "cups", "c", "c."], { to: "ml", factor: 236.6 });
alias(["fl oz", "fl. oz.", "fluid ounce", "fluid ounces"], { to: "ml", factor: 29.57 });
alias(["pint", "pints", "pt"], { to: "ml", factor: 473.2 });
alias(["quart", "quarts", "qt"], { to: "ml", factor: 946.4 });
alias(["gallon", "gallons", "gal"], { to: "ml", factor: 3785 });
alias(["oz", "oz.", "ounce", "ounces"], { to: "g", factor: 28.35 });
alias(["lb", "lb.", "lbs", "lbs.", "pound", "pounds"], { to: "g", factor: 453.6 });

function lookupMetric(unit: string): MetricUnit | undefined {
  // Case matters first: on old cards "T" is tablespoon and "t" is teaspoon.
  return TO_METRIC[unit.trim()] ?? TO_METRIC[unit.trim().toLowerCase()];
}

function roundMetric(value: number, unit: "ml" | "g") {
  if (value >= 1000) return { amount: String(Math.round(value / 100) / 10), unit: unit === "ml" ? "L" : "kg" };
  if (value >= 20) return { amount: String(Math.round(value / 5) * 5), unit };
  if (value >= 2) return { amount: String(Math.round(value)), unit };
  return { amount: String(Math.round(value * 10) / 10), unit };
}

export type DisplayIngredient = { amount: string; unit: string };

export function displayAmount(
  quantityText: string | null,
  quantity: number | null,
  unit: string | null,
  scale: number,
  system: "us" | "metric",
): DisplayIngredient {
  const u = unit ?? "";
  if (quantity == null) return { amount: quantityText ?? "", unit: u };
  const scaled = quantity * scale;
  if (system === "metric") {
    const m = lookupMetric(u);
    if (m) return roundMetric(scaled * m.factor, m.to);
  }
  return { amount: formatQuantity(scaled), unit: u };
}

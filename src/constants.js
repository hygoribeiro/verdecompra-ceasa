export const CATEGORIES = { fruta: "Frutas", verdura: "Verduras", legume: "Legumes", tempero: "Temperos", outros: "Outros" };
export const UNITS = ["kg", "caixa", "saco", "unidade", "duzia"];
export const TYPES = { normal: "Produto normal", promocao: "Produto de promoção", lucro: "Produto de lucro", risco: "Risco de perda" };
export const STATUS = { comprar: "Comprar", comprado: "Comprado", nao_comprar: "Não comprar" };
export const ROLES = { administrador: "Administrador", gerente: "Gerente da loja", comprador: "Comprador", funcionario: "Funcionário" };
export const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência", "Débito automático", "Outro"];
export const EXPENSE_STATUS = { pago: "Pago", pendente: "Pendente", vencido: "Vencido" };
export const PERIODS = { hoje: "Hoje", ontem: "Ontem", semana: "Esta semana", mes: "Este mês", ano: "Este ano", anterior: "Mês anterior", personalizado: "Personalizado" };
export const PRICING_TYPES = { percentage: "Por margem percentual", fixed: "Por valor fixo adicionado" };
export const ROUNDING_TYPES = { none: "Sem arredondar", final_99: "Final 0,99", final_49: "Final 0,49", final_90: "Final 0,90", automatic: "Automático comercial" };

export const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const num = (n) => Number(n || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const iso = (d) => new Date(d).toISOString().slice(0, 10);
export const margin = (item, margins) => Number(item.margin_percentage ?? item.manual_margin ?? margins[item.product?.category] ?? 40) + (item.product?.type === "risco" && item.margin_percentage == null && item.manual_margin == null ? 10 : 0);
export const amount = (item) => Number(item.weight_kg || item.purchased_quantity || 0);
export const purchaseSubtotal = item => Number(item.purchased_quantity || 0) * Number(item.paid_total || 0);
export const productTotal = item => item.status === "comprado" ? purchaseSubtotal(item) : 0;
export const cost = (item) => amount(item) ? purchaseSubtotal(item) / amount(item) : 0;
export const roundRetail = (v) => !v ? 0 : (v - Math.floor(v) <= 0.49 ? Math.floor(v) + 0.49 : Math.floor(v) + 0.99);
export const applyRounding = (value, type = "automatic") => {
  const v = Number(value || 0); if (!v || type === "none") return v;
  const base = Math.floor(v);
  if (type === "final_99") return Math.max(.99, (Number.isInteger(v) ? base - 1 : base) + .99);
  if (type === "final_49") return base + (v <= base + .49 ? .49 : 1.49);
  if (type === "final_90") return base + (v <= base + .90 ? .90 : 1.90);
  return roundRetail(v);
};
export const pricingWarning = item => {
  if (!Number(item.paid_total || 0)) return "Informe o valor pago para calcular o preço sugerido.";
  if (!Number(item.purchased_quantity || 0)) return "Informe a quantidade comprada para calcular o preço sugerido.";
  if (item.pricing_type === "fixed" && !Number(item.weight_kg || 0)) return "Informe o peso total para calcular o preço sugerido.";
  if (item.pricing_type !== "fixed" && !amount(item)) return "Informe o peso total ou quantidade para calcular o preço sugerido.";
  return "";
};
export const rawPrice = (item, margins) => item.pricing_type === "fixed"
  ? (purchaseSubtotal(item) + Number(item.fixed_markup_value || 0)) / Number(item.weight_kg || 0)
  : cost(item) * (1 + margin(item, margins) / 100);
export const price = (item, margins) => pricingWarning(item) ? 0 : Number(item.final_sale_price || 0) || applyRounding(rawPrice(item, margins), item.rounding_type || "automatic");
export const sale = (item, margins) => price(item, margins) * amount(item);
export const profit = (item, margins) => sale(item, margins) - productTotal(item);

export function periodRange(period, customStart = "", customEnd = "") {
  const now = new Date(); now.setHours(12, 0, 0, 0);
  let start = new Date(now), end = new Date(now);
  if (period === "ontem") { start.setDate(start.getDate() - 1); end = new Date(start); }
  if (period === "semana") { start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); }
  if (period === "mes") start = new Date(now.getFullYear(), now.getMonth(), 1, 12);
  if (period === "ano") start = new Date(now.getFullYear(), 0, 1, 12);
  if (period === "anterior") { start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12); end = new Date(now.getFullYear(), now.getMonth(), 0, 12); }
  if (period === "personalizado" && customStart && customEnd) return { start: customStart, end: customEnd };
  return { start: iso(start), end: iso(end) };
}

export function totals(items, margins) {
  return items.reduce((a, i) => ({ spent: a.spent + productTotal(i), sale: a.sale + sale(i, margins), gross: a.gross + profit(i, margins) }), { spent: 0, sale: 0, gross: 0 });
}

import test from "node:test";
import assert from "node:assert/strict";
import { productTotal, totals } from "./constants.js";

const bought = (quantity, unitPrice, extra = {}) => ({
  status: "comprado",
  purchased_quantity: quantity,
  paid_total: unitPrice,
  weight_kg: 0,
  product: { category: "outros", type: "normal" },
  ...extra,
});

test("calcula o total de um produto por quantidade vezes valor unitário", () => {
  assert.equal(productTotal(bought(2, 65)), 130);
  assert.equal(productTotal(bought(3, 80)), 240);
});

test("soma corretamente o total gasto no CEASA", () => {
  const result = totals([bought(2, 65), bought(3, 80)], {});
  assert.equal(result.spent, 370);
});

test("produto com status não comprar não entra no total", () => {
  assert.equal(productTotal(bought(2, 65, { status: "nao_comprar" })), 0);
});

test("produto planejado ainda não comprado não entra no total", () => {
  assert.equal(productTotal(bought(2, 65, { status: "comprar" })), 0);
});

test("produto sem valor ou sem quantidade não entra no total", () => {
  assert.equal(productTotal(bought(2, "")), 0);
  assert.equal(productTotal(bought("", 65)), 0);
  assert.equal(productTotal(bought(undefined, undefined)), 0);
});

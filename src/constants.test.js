import test from "node:test";
import assert from "node:assert/strict";
import { calculationUnit, cost, productTotal, rawPrice, sale, totals } from "./constants.js";

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

test("produto com status comprar entra no total quando possui quantidade e valor", () => {
  assert.equal(productTotal(bought(2, 65, { status: "comprar" })), 130);
});

test("produto sem valor ou sem quantidade não entra no total", () => {
  assert.equal(productTotal(bought(2, "")), 0);
  assert.equal(productTotal(bought("", 65)), 0);
  assert.equal(productTotal(bought(undefined, undefined)), 0);
});

test("produto por KG calcula total, custo por kg, venda e lucro pela base correta", () => {
  const item=bought(2,60,{weight_kg:40,rounding_type:"none",margin_percentage:50,product:{category:"outros",type:"normal",purchase_unit:"caixa",calculation_type:"kg"}});
  assert.equal(productTotal(item),120);
  assert.equal(cost(item),3);
  assert.equal(rawPrice(item,{}),4.5);
  assert.equal(sale(item,{}),180);
  assert.equal(calculationUnit(item),"kg");
});

test("produto por UNIDADE calcula total e custo por unidade sem usar peso", () => {
  const item=bought(50,3,{weight_kg:999,rounding_type:"none",margin_percentage:50,product:{category:"outros",type:"normal",purchase_unit:"unidade",calculation_type:"unidade"}});
  assert.equal(productTotal(item),150);
  assert.equal(cost(item),3);
  assert.equal(rawPrice(item,{}),4.5);
  assert.equal(sale(item,{}),225);
  assert.equal(calculationUnit(item),"un");
});

test("total CEASA soma produto KG e UNIDADE", () => {
  const kg=bought(2,60,{weight_kg:40,product:{category:"outros",type:"normal",calculation_type:"kg"}});
  const unit=bought(50,3,{product:{category:"outros",type:"normal",calculation_type:"unidade"}});
  assert.equal(totals([kg,unit],{}).spent,270);
});

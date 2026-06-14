import test from "node:test";
import assert from "node:assert/strict";
import { calculationUnit, cost, price, pricingTotal, productTotal, rawPrice, sale, totals } from "./constants.js";

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

test("valor fixo em produto por UNIDADE é acrescentado ao custo de cada unidade", () => {
  const item=bought(400,2.5,{pricing_type:"fixed",fixed_markup_value:10,rounding_type:"none",product:{category:"outros",type:"normal",purchase_unit:"unidade",calculation_type:"unidade"}});
  assert.equal(cost(item),2.5);
  assert.equal(rawPrice(item,{}),12.5);
  assert.equal(price(item,{}),12.5);
});

test("preço fixo por KG usa somente preço do produto mais valor fixo dividido pelo peso", () => {
  const create=(paid,fixed,weight,marginPercentage=999)=>bought(1,paid,{weight_kg:weight,pricing_type:"fixed",fixed_markup_value:fixed,margin_percentage:marginPercentage,rounding_type:"none",product:{category:"outros",type:"risco",purchase_unit:"caixa",calculation_type:"kg"}});
  assert.equal(rawPrice(create(60,50,20),{}),5.5);
  assert.equal(rawPrice(create(60,40,20),{}),5);
  assert.equal(rawPrice(create(100,20,30),{}),4);
  assert.equal(pricingTotal(create(60,50,20)),110);
});

test("preço fixo ignora margem percentual e preço final antigo", () => {
  const item=bought(1,60,{weight_kg:20,pricing_type:"fixed",fixed_markup_value:50,margin_percentage:999,final_sale_price:8.99,rounding_type:"none",product:{category:"outros",type:"risco",purchase_unit:"caixa",calculation_type:"kg"}});
  assert.equal(price(item,{}),5.5);
});

test("preço fixo não calcula quando peso total é zero", () => {
  const item=bought(1,60,{weight_kg:0,pricing_type:"fixed",fixed_markup_value:50,rounding_type:"none",product:{category:"outros",type:"normal",purchase_unit:"caixa",calculation_type:"kg"}});
  assert.equal(price(item,{}),0);
});

test("total CEASA soma produto KG e UNIDADE", () => {
  const kg=bought(2,60,{weight_kg:40,product:{category:"outros",type:"normal",calculation_type:"kg"}});
  const unit=bought(50,3,{product:{category:"outros",type:"normal",calculation_type:"unidade"}});
  assert.equal(totals([kg,unit],{}).spent,270);
});

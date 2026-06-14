-- Define se o custo e a venda de cada produto são calculados por KG ou UNIDADE.
-- Preserva todos os dados e classifica automaticamente os produtos existentes.

alter table public.products
add column if not exists calculation_type text;

update public.products
set calculation_type = case
  when purchase_unit in ('unidade', 'duzia') then 'unidade'
  else 'kg'
end
where calculation_type is null;

alter table public.products
alter column calculation_type set default 'kg';

alter table public.products
alter column calculation_type set not null;

alter table public.products
drop constraint if exists products_calculation_type_check;

alter table public.products
add constraint products_calculation_type_check
check (calculation_type in ('kg', 'unidade'));

create index if not exists products_calculation_type_idx
on public.products(store_id, calculation_type);

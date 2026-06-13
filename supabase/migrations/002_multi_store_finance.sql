-- Migração segura: multi-loja, financeiro, auditoria e permissões.
-- Antes deste arquivo, execute separadamente:
-- alter type public.user_role add value if not exists 'gerente';

do $$ begin
  create type public.expense_status as enum ('pago', 'pendente', 'vencido');
exception when duplicate_object then null; end $$;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.stores (name) values ('Santa Rita'), ('Taquari')
on conflict (name) do nothing;

alter table public.profiles add column if not exists store_id uuid references public.stores(id);
alter table public.shopping_lists add column if not exists store_id uuid references public.stores(id);
alter table public.products add column if not exists store_id uuid references public.stores(id);

update public.profiles set store_id = (select id from public.stores where name = 'Santa Rita') where store_id is null;
update public.shopping_lists set store_id = (select id from public.stores where name = 'Santa Rita') where store_id is null;
update public.products set store_id = (select id from public.stores where name = 'Santa Rita') where store_id is null;

alter table public.shopping_lists alter column store_id set not null;
alter table public.products alter column store_id set not null;

alter table public.products drop constraint if exists products_name_key;
create unique index if not exists products_store_name_key on public.products(store_id, name);
create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists shopping_lists_store_id_idx on public.shopping_lists(store_id);
create index if not exists profiles_store_id_idx on public.profiles(store_id);

insert into public.products (name, category, purchase_unit, type, active, store_id)
select p.name, p.category, p.purchase_unit, p.type, p.active, t.id
from public.products p cross join public.stores t
where p.store_id = (select id from public.stores where name = 'Santa Rita') and t.name = 'Taquari'
on conflict do nothing;

create table if not exists public.user_stores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, store_id)
);

insert into public.user_stores (user_id, store_id)
select id, store_id from public.profiles where store_id is not null
on conflict do nothing;

insert into public.user_stores (user_id, store_id)
select p.id, s.id from public.profiles p cross join public.stores s
where p.role = 'administrador'
on conflict do nothing;

create table if not exists public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.financial_categories (name) values
('CEASA'),('Funcionários'),('Aluguel'),('Energia'),('Água'),('Internet'),('Impostos'),
('Contabilidade'),('Cartão/maquininha'),('Combustível'),('Manutenção do caminhão'),
('Embalagens'),('Perdas/quebras'),('Retiradas do proprietário'),('Outros')
on conflict (name) do nothing;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  store_id uuid not null references public.stores(id),
  category_id uuid not null references public.financial_categories(id),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null default 'Pix',
  observation text not null default '',
  receipt_path text,
  status public.expense_status not null default 'pago',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_store_date_idx on public.expenses(store_id, expense_date);
create index if not exists expenses_category_idx on public.expenses(category_id);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id text not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

create or replace function public.audit_changes()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_log(table_name, record_id, action, old_data, new_data)
  values (tg_table_name, coalesce(new.id, old.id)::text, tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end; $$;

drop trigger if exists expenses_audit on public.expenses;
create trigger expenses_audit after insert or update or delete on public.expenses
for each row execute procedure public.audit_changes();
drop trigger if exists shopping_lists_audit on public.shopping_lists;
create trigger shopping_lists_audit after insert or update or delete on public.shopping_lists
for each row execute procedure public.audit_changes();
drop trigger if exists list_items_audit on public.list_items;
create trigger list_items_audit after insert or update or delete on public.list_items
for each row execute procedure public.audit_changes();

drop trigger if exists expenses_updated on public.expenses;
create trigger expenses_updated before update on public.expenses
for each row execute procedure public.touch_updated_at();

create or replace function public.can_access_store(target_store uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.current_user_role() = 'administrador'
    or exists(select 1 from public.user_stores us where us.user_id = auth.uid() and us.store_id = target_store)
$$;

create or replace function public.can_manage_finance(target_store uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.current_user_role() = 'administrador'
    or (public.current_user_role() = 'gerente' and public.can_access_store(target_store))
$$;

create or replace function public.protect_shopping_list_fields()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() = 'comprador' and (
    new.title is distinct from old.title or new.purchase_date is distinct from old.purchase_date or
    new.created_by is distinct from old.created_by or new.store_id is distinct from old.store_id
  ) then raise exception 'Comprador só pode finalizar a compra.';
  end if;
  return new;
end; $$;

create or replace function public.enforce_item_store()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (select store_id from public.shopping_lists where id = new.list_id)
     is distinct from
     (select store_id from public.products where id = new.product_id)
  then raise exception 'O produto e a lista precisam pertencer à mesma loja.';
  end if;
  return new;
end; $$;
drop trigger if exists enforce_item_store_trigger on public.list_items;
create trigger enforce_item_store_trigger before insert or update of list_id, product_id on public.list_items
for each row execute procedure public.enforce_item_store();

-- Recria políticas principais para limitar dados por loja.
drop policy if exists "authenticated reads products" on public.products;
drop policy if exists "admin employee insert products" on public.products;
drop policy if exists "admin employee update products" on public.products;
drop policy if exists "admin deletes products" on public.products;
drop policy if exists "store users read products" on public.products;
drop policy if exists "store planners insert products" on public.products;
drop policy if exists "store planners update products" on public.products;
create policy "store users read products" on public.products for select to authenticated using (public.can_access_store(store_id));
create policy "store planners insert products" on public.products for insert to authenticated with check (public.can_access_store(store_id) and public.current_user_role() in ('administrador','gerente','funcionario'));
create policy "store planners update products" on public.products for update to authenticated using (public.can_access_store(store_id) and public.current_user_role() in ('administrador','gerente','funcionario')) with check (public.can_access_store(store_id));
create policy "admin deletes products" on public.products for delete to authenticated using (public.current_user_role() = 'administrador');

drop policy if exists "authenticated reads lists" on public.shopping_lists;
drop policy if exists "admin employee creates lists" on public.shopping_lists;
drop policy if exists "roles update allowed list fields" on public.shopping_lists;
drop policy if exists "admin deletes lists" on public.shopping_lists;
drop policy if exists "store users read lists" on public.shopping_lists;
drop policy if exists "store planners create lists" on public.shopping_lists;
drop policy if exists "store roles update lists" on public.shopping_lists;
create policy "store users read lists" on public.shopping_lists for select to authenticated using (public.can_access_store(store_id));
create policy "store planners create lists" on public.shopping_lists for insert to authenticated with check (public.can_access_store(store_id) and public.current_user_role() in ('administrador','gerente','funcionario') and created_by = auth.uid());
create policy "store roles update lists" on public.shopping_lists for update to authenticated using (public.can_access_store(store_id) and public.current_user_role() in ('administrador','gerente','funcionario','comprador')) with check (public.can_access_store(store_id));
create policy "admin deletes lists" on public.shopping_lists for delete to authenticated using (public.current_user_role() = 'administrador');

drop policy if exists "authenticated reads items" on public.list_items;
drop policy if exists "admin employee creates items" on public.list_items;
drop policy if exists "roles update allowed item fields" on public.list_items;
drop policy if exists "admin employee deletes items" on public.list_items;
drop policy if exists "store users read items" on public.list_items;
drop policy if exists "store planners create items" on public.list_items;
drop policy if exists "store roles update items" on public.list_items;
drop policy if exists "store planners delete items" on public.list_items;
create policy "store users read items" on public.list_items for select to authenticated using (exists(select 1 from public.shopping_lists l where l.id = list_id and public.can_access_store(l.store_id)));
create policy "store planners create items" on public.list_items for insert to authenticated with check (public.current_user_role() in ('administrador','gerente','funcionario') and exists(select 1 from public.shopping_lists l where l.id = list_id and public.can_access_store(l.store_id)));
create policy "store roles update items" on public.list_items for update to authenticated using (public.current_user_role() in ('administrador','gerente','funcionario','comprador') and exists(select 1 from public.shopping_lists l where l.id = list_id and public.can_access_store(l.store_id)));
create policy "store planners delete items" on public.list_items for delete to authenticated using (public.current_user_role() in ('administrador','gerente','funcionario') and exists(select 1 from public.shopping_lists l where l.id = list_id and public.can_access_store(l.store_id)));

alter table public.stores enable row level security;
alter table public.user_stores enable row level security;
alter table public.financial_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "users read allowed stores" on public.stores;
drop policy if exists "admin manages stores" on public.stores;
drop policy if exists "users read own stores" on public.user_stores;
drop policy if exists "admin manages user stores" on public.user_stores;
drop policy if exists "authenticated reads finance categories" on public.financial_categories;
drop policy if exists "admin manages finance categories" on public.financial_categories;
drop policy if exists "finance managers read expenses" on public.expenses;
drop policy if exists "finance managers insert expenses" on public.expenses;
drop policy if exists "finance managers update expenses" on public.expenses;
drop policy if exists "finance managers delete expenses" on public.expenses;
drop policy if exists "admin reads audit" on public.audit_log;
create policy "users read allowed stores" on public.stores for select to authenticated using (public.can_access_store(id));
create policy "admin manages stores" on public.stores for all to authenticated using (public.current_user_role() = 'administrador') with check (public.current_user_role() = 'administrador');
create policy "users read own stores" on public.user_stores for select to authenticated using (user_id = auth.uid() or public.current_user_role() = 'administrador');
create policy "admin manages user stores" on public.user_stores for all to authenticated using (public.current_user_role() = 'administrador') with check (public.current_user_role() = 'administrador');
create policy "authenticated reads finance categories" on public.financial_categories for select to authenticated using (true);
create policy "admin manages finance categories" on public.financial_categories for all to authenticated using (public.current_user_role() = 'administrador') with check (public.current_user_role() = 'administrador');
create policy "finance managers read expenses" on public.expenses for select to authenticated using (public.can_manage_finance(store_id));
create policy "finance managers insert expenses" on public.expenses for insert to authenticated with check (public.can_manage_finance(store_id) and created_by = auth.uid());
create policy "finance managers update expenses" on public.expenses for update to authenticated using (public.can_manage_finance(store_id)) with check (public.can_manage_finance(store_id));
create policy "finance managers delete expenses" on public.expenses for delete to authenticated using (public.can_manage_finance(store_id));
create policy "admin reads audit" on public.audit_log for select to authenticated using (public.current_user_role() = 'administrador');

grant select on public.stores, public.user_stores, public.financial_categories, public.expenses, public.audit_log to authenticated;
grant insert, update, delete on public.stores, public.user_stores, public.financial_categories, public.expenses to authenticated;

-- Bucket privado para comprovantes. A interface grava o caminho em expenses.receipt_path.
insert into storage.buckets (id, name, public) values ('expense-receipts','expense-receipts',false)
on conflict (id) do nothing;
drop policy if exists "finance managers upload receipts" on storage.objects;
drop policy if exists "finance managers read receipts" on storage.objects;
create policy "finance managers upload receipts" on storage.objects for insert to authenticated
with check (bucket_id = 'expense-receipts' and public.can_manage_finance(((storage.foldername(name))[1])::uuid));
create policy "finance managers read receipts" on storage.objects for select to authenticated
using (bucket_id = 'expense-receipts' and public.can_manage_finance(((storage.foldername(name))[1])::uuid));

do $$ begin alter publication supabase_realtime add table public.expenses; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.stores; exception when duplicate_object then null; end $$;

-- Exemplos financeiros iniciais, sem duplicar em reexecuções.
insert into public.expenses (expense_date, store_id, category_id, description, amount, payment_method, status, created_by)
select current_date, s.id, c.id, 'Conta de energia - exemplo', 480.00, 'Pix', 'pago', p.id
from public.stores s, public.financial_categories c, lateral (select id from public.profiles where role='administrador' limit 1) p
where s.name='Santa Rita' and c.name='Energia'
and not exists(select 1 from public.expenses where description='Conta de energia - exemplo');

insert into public.expenses (expense_date, store_id, category_id, description, amount, payment_method, status, created_by)
select current_date, s.id, c.id, 'Combustível - exemplo', 320.00, 'Cartão', 'pago', p.id
from public.stores s, public.financial_categories c, lateral (select id from public.profiles where role='administrador' limit 1) p
where s.name='Taquari' and c.name='Combustível'
and not exists(select 1 from public.expenses where description='Combustível - exemplo');

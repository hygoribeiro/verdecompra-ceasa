-- Gestao financeira completa, segura e compativel com os dados existentes.
-- Execute depois das migracoes 001 e 002.

create table if not exists public.financial_entry_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.financial_entry_categories (name) values
('Venda em dinheiro'), ('Venda via PIX'), ('Venda via cartao de debito'),
('Venda via cartao de credito'), ('Recebimentos diversos'),
('Aportes do proprietario'), ('Transferencias recebidas'), ('Outros recebimentos')
on conflict (name) do nothing;

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  store_id uuid not null references public.stores(id),
  category_id uuid references public.financial_entry_categories(id),
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  receipt_method text not null default 'PIX',
  observation text not null default '',
  receipt_path text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_revenue (
  id uuid primary key default gen_random_uuid(),
  revenue_date date not null default current_date,
  store_id uuid not null references public.stores(id),
  cash_amount numeric(14,2) not null default 0 check (cash_amount >= 0),
  pix_amount numeric(14,2) not null default 0 check (pix_amount >= 0),
  debit_amount numeric(14,2) not null default 0 check (debit_amount >= 0),
  credit_amount numeric(14,2) not null default 0 check (credit_amount >= 0),
  other_amount numeric(14,2) not null default 0 check (other_amount >= 0),
  total_amount numeric(14,2) generated always as
    (cash_amount + pix_amount + debit_amount + credit_amount + other_amount) stored,
  observation text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, revenue_date)
);

create table if not exists public.cash_openings (
  id uuid primary key default gen_random_uuid(),
  opening_date date not null default current_date,
  store_id uuid not null references public.stores(id),
  opening_amount numeric(14,2) not null default 0 check (opening_amount >= 0),
  observation text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, opening_date)
);

create table if not exists public.cash_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null default current_date,
  store_id uuid not null references public.stores(id),
  expected_total numeric(14,2) not null default 0,
  counted_cash numeric(14,2) not null default 0 check (counted_cash >= 0),
  pix_received numeric(14,2) not null default 0 check (pix_received >= 0),
  debit_received numeric(14,2) not null default 0 check (debit_received >= 0),
  credit_received numeric(14,2) not null default 0 check (credit_received >= 0),
  other_received numeric(14,2) not null default 0 check (other_received >= 0),
  informed_total numeric(14,2) generated always as
    (counted_cash + pix_received + debit_received + credit_received + other_received) stored,
  difference numeric(14,2) generated always as
    ((counted_cash + pix_received + debit_received + credit_received + other_received) - expected_total) stored,
  observation text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, closing_date)
);

create table if not exists public.monthly_results (
  id uuid primary key default gen_random_uuid(),
  result_month date not null,
  store_id uuid not null references public.stores(id),
  revenue numeric(14,2) not null default 0,
  ceasa_purchases numeric(14,2) not null default 0,
  operating_expenses numeric(14,2) not null default 0,
  taxes numeric(14,2) not null default 0,
  operating_profit numeric(14,2) not null default 0,
  net_profit numeric(14,2) not null default 0,
  calculated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, result_month)
);
alter table public.monthly_results add column if not exists updated_at timestamptz not null default now();

-- Livro-caixa automatico. A origem impede duplicacao ao reexecutar gatilhos.
create table if not exists public.cash_flow (
  id uuid primary key default gen_random_uuid(),
  movement_date date not null,
  store_id uuid not null references public.stores(id),
  movement_type text not null check (movement_type in ('entrada','saida')),
  source_table text not null,
  source_id uuid not null,
  category text not null default '',
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (source_table, source_id)
);

create index if not exists financial_entries_store_date_idx on public.financial_entries(store_id, entry_date);
create index if not exists daily_revenue_store_date_idx on public.daily_revenue(store_id, revenue_date);
create index if not exists cash_flow_store_date_idx on public.cash_flow(store_id, movement_date);
create index if not exists monthly_results_store_month_idx on public.monthly_results(store_id, result_month);

create or replace function public.sync_financial_entry_cash_flow()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.cash_flow where source_table = 'financial_entries' and source_id = old.id;
    return old;
  end if;
  insert into public.cash_flow(movement_date, store_id, movement_type, source_table, source_id, category, description, amount)
  values (new.entry_date, new.store_id, 'entrada', 'financial_entries', new.id,
    coalesce((select name from public.financial_entry_categories where id = new.category_id), new.receipt_method),
    new.description, new.amount)
  on conflict (source_table, source_id) do update set
    movement_date=excluded.movement_date, store_id=excluded.store_id, category=excluded.category,
    description=excluded.description, amount=excluded.amount;
  return new;
end; $$;

create or replace function public.sync_expense_cash_flow()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.cash_flow where source_table = 'expenses' and source_id = old.id;
    return old;
  end if;
  insert into public.cash_flow(movement_date, store_id, movement_type, source_table, source_id, category, description, amount)
  values (new.expense_date, new.store_id, 'saida', 'expenses', new.id,
    coalesce((select name from public.financial_categories where id = new.category_id), 'Despesa'),
    new.description, new.amount)
  on conflict (source_table, source_id) do update set
    movement_date=excluded.movement_date, store_id=excluded.store_id, category=excluded.category,
    description=excluded.description, amount=excluded.amount;
  return new;
end; $$;

create or replace function public.sync_daily_revenue_cash_flow()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.cash_flow where source_table = 'daily_revenue' and source_id = old.id;
    return old;
  end if;
  insert into public.cash_flow(movement_date, store_id, movement_type, source_table, source_id, category, description, amount)
  values (new.revenue_date, new.store_id, 'entrada', 'daily_revenue', new.id,
    'Faturamento diario', 'Faturamento diario', new.total_amount)
  on conflict (source_table, source_id) do update set
    movement_date=excluded.movement_date, store_id=excluded.store_id,
    description=excluded.description, amount=excluded.amount;
  return new;
end; $$;

drop trigger if exists financial_entries_cash_flow on public.financial_entries;
create trigger financial_entries_cash_flow after insert or update or delete on public.financial_entries
for each row execute procedure public.sync_financial_entry_cash_flow();
drop trigger if exists expenses_cash_flow on public.expenses;
create trigger expenses_cash_flow after insert or update or delete on public.expenses
for each row execute procedure public.sync_expense_cash_flow();
drop trigger if exists daily_revenue_cash_flow on public.daily_revenue;
create trigger daily_revenue_cash_flow after insert or update or delete on public.daily_revenue
for each row execute procedure public.sync_daily_revenue_cash_flow();

-- Importa despesas ja existentes no livro-caixa, sem alterar os registros originais.
insert into public.cash_flow(movement_date, store_id, movement_type, source_table, source_id, category, description, amount)
select e.expense_date, e.store_id, 'saida', 'expenses', e.id, coalesce(c.name,'Despesa'), e.description, e.amount
from public.expenses e left join public.financial_categories c on c.id=e.category_id
on conflict (source_table, source_id) do nothing;

insert into public.cash_flow(movement_date, store_id, movement_type, source_table, source_id, category, description, amount)
select r.revenue_date, r.store_id, 'entrada', 'daily_revenue', r.id, 'Faturamento diario', 'Faturamento diario', r.total_amount
from public.daily_revenue r on conflict (source_table, source_id) do nothing;

-- Nomes de compatibilidade pedidos, mantendo expenses como fonte original.
create or replace view public.financial_expenses as select * from public.expenses;
create or replace view public.ceasa_purchases as
select l.id, l.store_id, l.purchase_date, l.title, l.status,
  coalesce(sum(i.paid_total),0)::numeric(14,2) as total_paid
from public.shopping_lists l left join public.list_items i on i.list_id=l.id
group by l.id, l.store_id, l.purchase_date, l.title, l.status;

do $$ declare table_name text;
begin
  foreach table_name in array array['financial_entries','daily_revenue','cash_openings','cash_closings','monthly_results']
  loop
    execute format('drop trigger if exists %I_updated on public.%I', table_name, table_name);
    execute format('create trigger %I_updated before update on public.%I for each row execute procedure public.touch_updated_at()', table_name, table_name);
    execute format('drop trigger if exists %I_audit on public.%I', table_name, table_name);
    execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute procedure public.audit_changes()', table_name, table_name);
  end loop;
end $$;

-- Exemplos iniciais, criados apenas uma vez.
insert into public.financial_entries(entry_date,store_id,category_id,description,amount,receipt_method,created_by)
select current_date,s.id,c.id,'Venda PIX - exemplo',850.00,'PIX',p.id
from public.stores s, public.financial_entry_categories c,
lateral (select id from public.profiles where role='administrador' limit 1) p
where s.name='Santa Rita' and c.name='Venda via PIX'
and not exists(select 1 from public.financial_entries where description='Venda PIX - exemplo');

insert into public.daily_revenue(revenue_date,store_id,cash_amount,pix_amount,debit_amount,credit_amount,other_amount,created_by)
select current_date,s.id,300,400,250,180,0,p.id
from public.stores s, lateral (select id from public.profiles where role='administrador' limit 1) p
where s.name='Santa Rita'
on conflict (store_id,revenue_date) do nothing;

alter table public.financial_entry_categories enable row level security;
alter table public.financial_entries enable row level security;
alter table public.daily_revenue enable row level security;
alter table public.cash_openings enable row level security;
alter table public.cash_closings enable row level security;
alter table public.monthly_results enable row level security;
alter table public.cash_flow enable row level security;

drop policy if exists "authenticated reads entry categories" on public.financial_entry_categories;
drop policy if exists "admin manages entry categories" on public.financial_entry_categories;
create policy "authenticated reads entry categories" on public.financial_entry_categories for select to authenticated using (true);
create policy "admin manages entry categories" on public.financial_entry_categories for all to authenticated
using (public.current_user_role()='administrador') with check (public.current_user_role()='administrador');

do $$ declare table_name text;
begin
  foreach table_name in array array['financial_entries','daily_revenue','cash_openings','cash_closings','monthly_results','cash_flow']
  loop
    execute format('drop policy if exists "finance read %s" on public.%I', table_name, table_name);
    execute format('drop policy if exists "finance insert %s" on public.%I', table_name, table_name);
    execute format('drop policy if exists "finance update %s" on public.%I', table_name, table_name);
    execute format('drop policy if exists "finance delete %s" on public.%I', table_name, table_name);
    execute format('create policy "finance read %s" on public.%I for select to authenticated using (public.can_manage_finance(store_id))', table_name, table_name);
    execute format('create policy "finance insert %s" on public.%I for insert to authenticated with check (public.can_manage_finance(store_id))', table_name, table_name);
    execute format('create policy "finance update %s" on public.%I for update to authenticated using (public.can_manage_finance(store_id)) with check (public.can_manage_finance(store_id))', table_name, table_name);
    execute format('create policy "finance delete %s" on public.%I for delete to authenticated using (public.can_manage_finance(store_id))', table_name, table_name);
  end loop;
end $$;

grant select on public.financial_entry_categories, public.financial_entries, public.daily_revenue,
  public.cash_openings, public.cash_closings, public.monthly_results, public.cash_flow,
  public.financial_expenses, public.ceasa_purchases to authenticated;
grant insert, update, delete on public.financial_entry_categories, public.financial_entries,
  public.daily_revenue, public.cash_openings, public.cash_closings, public.monthly_results to authenticated;

insert into storage.buckets (id, name, public) values ('financial-receipts','financial-receipts',false)
on conflict (id) do nothing;
drop policy if exists "finance upload financial receipts" on storage.objects;
drop policy if exists "finance read financial receipts" on storage.objects;
create policy "finance upload financial receipts" on storage.objects for insert to authenticated
with check (bucket_id='financial-receipts' and public.can_manage_finance(((storage.foldername(name))[1])::uuid));
create policy "finance read financial receipts" on storage.objects for select to authenticated
using (bucket_id='financial-receipts' and public.can_manage_finance(((storage.foldername(name))[1])::uuid));

do $$ declare table_name text;
begin
  foreach table_name in array array['financial_entries','daily_revenue','cash_openings','cash_closings','cash_flow']
  loop
    begin execute format('alter publication supabase_realtime add table public.%I', table_name);
    exception when duplicate_object then null; end;
  end loop;
end $$;

-- VerdeCompra CEASA - schema completo para executar no SQL Editor do Supabase.
create extension if not exists "pgcrypto";

create type public.user_role as enum ('administrador', 'comprador', 'funcionario');
create type public.product_category as enum ('fruta', 'verdura', 'legume', 'tempero', 'outros');
create type public.purchase_unit as enum ('kg', 'caixa', 'saco', 'unidade', 'duzia');
create type public.product_type as enum ('normal', 'promocao', 'lucro', 'risco');
create type public.item_status as enum ('comprar', 'comprado', 'nao_comprar');
create type public.list_status as enum ('aberta', 'finalizada');
create type public.product_quality as enum ('excelente', 'boa', 'regular', 'ruim');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'funcionario',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.product_category not null,
  purchase_unit public.purchase_unit not null,
  type public.product_type not null default 'normal',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category_margins (
  category public.product_category primary key,
  margin numeric(6,2) not null check (margin >= 0),
  updated_at timestamptz not null default now()
);

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status public.list_status not null default 'aberta',
  purchase_date date not null default current_date,
  created_by uuid not null references public.profiles(id),
  finalized_by uuid references public.profiles(id),
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid not null references public.products(id),
  status public.item_status not null default 'comprar',
  planned_quantity numeric(12,3) not null default 1 check (planned_quantity >= 0),
  purchased_quantity numeric(12,3) not null default 0 check (purchased_quantity >= 0),
  weight_kg numeric(12,3) not null default 0 check (weight_kg >= 0),
  paid_total numeric(12,2) not null default 0 check (paid_total >= 0),
  quality public.product_quality not null default 'boa',
  observation text not null default '',
  manual_margin numeric(6,2) check (manual_margin >= 0),
  final_sale_price numeric(12,2) check (final_sale_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, product_id)
);

create index list_items_list_id_idx on public.list_items(list_id);
create index shopping_lists_status_idx on public.shopping_lists(status);

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger products_updated before update on public.products for each row execute procedure public.touch_updated_at();
create trigger list_items_updated before update on public.list_items for each row execute procedure public.touch_updated_at();

-- Defesa adicional: comprador só altera execução da compra; funcionário só altera planejamento.
create or replace function public.protect_list_item_fields()
returns trigger language plpgsql security definer set search_path = public
as $$
declare r public.user_role := public.current_user_role();
begin
  if r = 'comprador' and (
    new.list_id is distinct from old.list_id or new.product_id is distinct from old.product_id or
    new.planned_quantity is distinct from old.planned_quantity or new.manual_margin is distinct from old.manual_margin or
    new.final_sale_price is distinct from old.final_sale_price
  ) then raise exception 'Comprador não pode alterar cadastro, planejamento ou margem.';
  end if;
  if r = 'funcionario' and (
    new.purchased_quantity is distinct from old.purchased_quantity or new.weight_kg is distinct from old.weight_kg or
    new.paid_total is distinct from old.paid_total or new.quality is distinct from old.quality
  ) then raise exception 'Funcionário não pode alterar valores da compra.';
  end if;
  return new;
end; $$;
create trigger protect_list_item_update before update on public.list_items for each row execute procedure public.protect_list_item_fields();

create or replace function public.protect_shopping_list_fields()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() = 'comprador' and (
    new.title is distinct from old.title or new.purchase_date is distinct from old.purchase_date or
    new.created_by is distinct from old.created_by
  ) then raise exception 'Comprador só pode finalizar a compra.';
  end if;
  return new;
end; $$;
create trigger protect_shopping_list_update before update on public.shopping_lists for each row execute procedure public.protect_shopping_list_fields();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.category_margins enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.list_items enable row level security;

create policy "profile own or admin read" on public.profiles for select to authenticated using (id = auth.uid() or public.current_user_role() = 'administrador');
create policy "admin manages profiles" on public.profiles for update to authenticated using (public.current_user_role() = 'administrador') with check (public.current_user_role() = 'administrador');

create policy "authenticated reads products" on public.products for select to authenticated using (true);
create policy "admin employee insert products" on public.products for insert to authenticated with check (public.current_user_role() in ('administrador','funcionario'));
create policy "admin employee update products" on public.products for update to authenticated using (public.current_user_role() in ('administrador','funcionario')) with check (public.current_user_role() in ('administrador','funcionario'));
create policy "admin deletes products" on public.products for delete to authenticated using (public.current_user_role() = 'administrador');

create policy "authenticated reads margins" on public.category_margins for select to authenticated using (true);
create policy "admin manages margins" on public.category_margins for all to authenticated using (public.current_user_role() = 'administrador') with check (public.current_user_role() = 'administrador');

create policy "authenticated reads lists" on public.shopping_lists for select to authenticated using (true);
create policy "admin employee creates lists" on public.shopping_lists for insert to authenticated with check (public.current_user_role() in ('administrador','funcionario') and created_by = auth.uid());
create policy "roles update allowed list fields" on public.shopping_lists for update to authenticated using (public.current_user_role() in ('administrador','funcionario','comprador')) with check (public.current_user_role() in ('administrador','funcionario','comprador'));
create policy "admin deletes lists" on public.shopping_lists for delete to authenticated using (public.current_user_role() = 'administrador');

create policy "authenticated reads items" on public.list_items for select to authenticated using (true);
create policy "admin employee creates items" on public.list_items for insert to authenticated with check (public.current_user_role() in ('administrador','funcionario'));
create policy "roles update allowed item fields" on public.list_items for update to authenticated using (public.current_user_role() in ('administrador','comprador','funcionario')) with check (public.current_user_role() in ('administrador','comprador','funcionario'));
create policy "admin employee deletes items" on public.list_items for delete to authenticated using (public.current_user_role() in ('administrador','funcionario'));

grant usage on schema public to authenticated;
grant select on public.profiles, public.products, public.category_margins, public.shopping_lists, public.list_items to authenticated;
grant update on public.profiles to authenticated;
grant insert, update, delete on public.products, public.category_margins, public.shopping_lists, public.list_items to authenticated;

insert into public.category_margins values ('fruta',40),('verdura',50),('legume',45),('tempero',60),('outros',40);
insert into public.products (name,category,purchase_unit,type) values
('Banana prata','fruta','caixa','normal'),('Maçã gala','fruta','caixa','normal'),('Laranja pera','fruta','saco','promocao'),
('Mamão formosa','fruta','caixa','risco'),('Melancia','fruta','unidade','promocao'),('Alface crespa','verdura','unidade','risco'),
('Couve manteiga','verdura','unidade','risco'),('Rúcula','verdura','unidade','risco'),('Repolho verde','verdura','kg','normal'),
('Agrião','verdura','unidade','risco'),('Tomate italiano','legume','caixa','normal'),('Batata inglesa','legume','saco','normal'),
('Cebola','legume','saco','normal'),('Cenoura','legume','caixa','normal'),('Abobrinha','legume','caixa','risco'),
('Alho','tempero','caixa','lucro'),('Salsinha','tempero','unidade','risco'),('Cebolinha','tempero','unidade','risco'),
('Pimentão verde','tempero','caixa','lucro'),('Gengibre','tempero','kg','lucro');

alter publication supabase_realtime add table public.list_items;
alter publication supabase_realtime add table public.shopping_lists;
alter publication supabase_realtime add table public.products;

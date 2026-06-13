# Guia: Financeiro, lojas e permissões

## Aplicar a migração sem apagar dados

1. No Supabase, abra **SQL Editor > New query**.
2. Copie todo o arquivo `supabase/migrations/002_multi_store_finance.sql`.
3. Cole e execute uma única vez.
4. Confirme que `stores`, `expenses`, `financial_categories`, `user_stores` e `audit_log` foram criadas.

A migração não apaga dados. Compras, produtos e usuários existentes são associados à loja **Santa Rita**. A loja **Taquari** e uma cópia inicial do catálogo são criadas automaticamente.

## Usar o financeiro

1. Entre como administrador ou gerente.
2. Selecione uma loja no topo. O administrador também pode selecionar **Todas as lojas**.
3. Abra **Financeiro**.
4. Cadastre data, categoria, descrição, valor, pagamento, status, observação e comprovante.
5. Use o seletor de período no topo e os filtros de busca/categoria.
6. Use **Exportar Excel** para baixar CSV compatível com Excel ou **Imprimir / PDF**.

Excluir uma despesa exige confirmação e gera registro em `audit_log`.

## Cadastrar lojas

Entre como administrador, abra **Ajustes** e clique em **Cadastrar loja**.

## Configurar usuários e lojas

Crie o usuário em **Authentication > Users**. Depois, execute:

```sql
update public.profiles
set role = 'gerente',
    store_id = (select id from public.stores where name = 'Santa Rita')
where id = (select id from auth.users where email = 'gerente@exemplo.com');

insert into public.user_stores (user_id, store_id)
select u.id, s.id from auth.users u, public.stores s
where u.email = 'gerente@exemplo.com' and s.name = 'Santa Rita'
on conflict do nothing;
```

Perfis: `administrador`, `gerente`, `funcionario` e `comprador`.

## Testar filtros e dashboards

1. Cadastre despesas em Santa Rita e Taquari.
2. Finalize uma compra CEASA para cada loja.
3. Selecione **Todas as lojas** e abra **Dashboard**.
4. Teste todos os períodos e o período personalizado.
5. Confirme os cálculos:
   - Lucro bruto = venda estimada - gasto CEASA
   - Lucro líquido = venda estimada - gasto CEASA - despesas
   - Margem líquida = lucro líquido / venda estimada × 100
6. Entre com cada perfil e confirme as permissões.

Alterações em despesas, listas e itens ficam registradas em `audit_log`.

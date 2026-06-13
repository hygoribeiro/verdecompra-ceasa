# Centro Financeiro - Verdurão Ribeiro

## 1. Atualizar o banco com segurança

1. Abra o projeto no Supabase.
2. Entre em **SQL Editor** e clique em **New query**.
3. Abra o arquivo `supabase/migrations/003_complete_financial_management.sql`.
4. Copie todo o conteúdo, cole no editor e clique em **Run**.
5. Se o Supabase mostrar o aviso de segurança, escolha **Execute e ative o RLS**.

Essa migração não apaga dados. As despesas já cadastradas continuam em `expenses` e são incluídas automaticamente no fluxo de caixa.

## 2. Publicar a nova versão

Envie ao GitHub os arquivos atualizados, principalmente:

- `src/App.jsx`
- `src/FinanceCenter.jsx`
- `src/constants.js`
- `styles.css`
- `supabase/migrations/003_complete_financial_management.sql`

A Vercel fará uma nova publicação automaticamente após o envio.

## 3. Como usar

- Selecione **Todas as lojas**, **Santa Rita** ou **Taquari** no topo.
- Escolha o período: hoje, ontem, semana, mês, ano ou personalizado.
- Abra **Centro Financeiro**.
- Use **Entradas** para recebimentos avulsos.
- Use **Despesas** para contas a pagar e gastos.
- Use **Faturamento Diário** para lançar o fechamento diário por forma de recebimento.
- Use **Caixa Diário** para registrar abertura e fechamento e conferir divergências.
- Consulte **Fluxo de Caixa** e **Resultado do Mês** para acompanhar saldo e lucro.

## 4. Permissões

- **Administrador:** todas as lojas e consolidado.
- **Gerente:** somente as lojas vinculadas ao usuário.
- **Funcionário e comprador:** não acessam o Centro Financeiro.

O vínculo é controlado pela tabela `user_stores`. Todas as novas tabelas possuem RLS para impedir acesso a lojas não autorizadas.

## 5. Teste recomendado

1. Cadastre uma entrada de R$ 100,00.
2. Cadastre uma despesa de R$ 30,00.
3. Confira se o Fluxo de Caixa mostra saldo de R$ 70,00.
4. Lance o Faturamento Diário.
5. Faça uma abertura e um fechamento com valores diferentes para testar o alerta.
6. Troque de loja e confirme que os dados são separados.
7. Entre como gerente e confirme que ele vê apenas sua loja.

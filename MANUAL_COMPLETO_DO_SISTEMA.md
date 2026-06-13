# Manual Completo do Sistema

## Verdurão Ribeiro - Controle CEASA e Centro Financeiro

Este manual explica, passo a passo, como configurar, acessar, operar, administrar, conferir e atualizar o sistema do Verdurão Ribeiro.

---

# 1. O que o sistema controla

O sistema reúne:

- cadastro de produtos;
- listas de compras do CEASA;
- operação do comprador no CEASA;
- histórico das últimas listas;
- despesas;
- entradas financeiras;
- faturamento diário;
- abertura e fechamento de caixa;
- fluxo de caixa;
- resultado financeiro;
- relatórios;
- lojas Santa Rita e Taquari;
- usuários e permissões;
- histórico de alterações.

Todas as informações são separadas por loja. O administrador pode visualizar uma loja individualmente ou o consolidado das duas lojas.

---

# 2. Perfis e permissões

## Administrador

O administrador pode:

- visualizar todas as lojas;
- selecionar **Todas as lojas**;
- acessar o Dashboard geral;
- cadastrar lojas;
- criar listas;
- cadastrar produtos;
- preencher compras;
- finalizar compras;
- acessar todo o Centro Financeiro;
- cadastrar, editar e excluir despesas e entradas;
- visualizar relatórios;
- alterar margens;
- consultar o histórico de alterações.

## Gerente

O gerente pode:

- acessar somente a loja vinculada ao seu usuário;
- criar listas;
- cadastrar produtos;
- acompanhar compras;
- acessar o Centro Financeiro da própria loja;
- lançar despesas, entradas, faturamento e caixa;
- visualizar relatórios da própria loja.

## Funcionário

O funcionário pode:

- acessar somente sua loja;
- cadastrar produtos;
- criar listas de compra;
- adicionar produtos à lista;
- informar quantidades planejadas.

O funcionário não pode acessar o Centro Financeiro.

## Comprador

O comprador pode:

- acessar a lista do CEASA;
- informar quantidade comprada;
- informar peso;
- informar valor pago;
- informar qualidade;
- adicionar observações;
- marcar produtos como comprados;
- finalizar a compra.

O comprador não pode acessar o Centro Financeiro nem cadastrar produtos.

---

# 3. Primeiro acesso

1. Abra a URL do sistema no navegador:

   `https://verdecompra-ceasa.vercel.app`

2. Na tela **Entrar**, informe:

   - e-mail cadastrado;
   - senha cadastrada.

3. Clique em **Entrar**.
4. Aguarde o carregamento.
5. Confira no canto superior direito qual perfil está conectado.
6. Para sair do sistema, clique no botão do perfil no canto superior direito.

## Se o login não funcionar

1. Confira se o e-mail foi digitado em letras minúsculas.
2. Confira a senha.
3. No Supabase, abra **Authentication > Users**.
4. Confirme que o usuário está cadastrado.
5. Abra **Table Editor > profiles**.
6. Confirme que o usuário possui um perfil válido.

---

# 4. Como selecionar a loja

No topo do sistema existe o seletor de loja.

## Administrador

O administrador pode selecionar:

- **Todas as lojas**: mostra o consolidado de Santa Rita e Taquari;
- **Santa Rita**: mostra e permite lançar dados da Santa Rita;
- **Taquari**: mostra e permite lançar dados do Taquari.

Para criar listas, cadastrar produtos ou realizar lançamentos, selecione uma loja específica.

## Outros usuários

Gerentes, funcionários e compradores visualizam somente as lojas permitidas para seu usuário.

## Regra importante

Antes de cadastrar qualquer informação, confira a loja selecionada. Um lançamento realizado na loja errada ficará vinculado àquela loja.

---

# 5. Como selecionar o período

Na parte superior da página existe o filtro **Período**.

As opções são:

- **Hoje**;
- **Ontem**;
- **Esta semana**;
- **Este mês**;
- **Este ano**;
- **Mês anterior**;
- **Personalizado**.

## Período personalizado

1. Selecione **Personalizado**.
2. Informe a data inicial.
3. Informe a data final.
4. As telas e relatórios serão atualizados com o período escolhido.

O período selecionado afeta Dashboard, Centro Financeiro e Relatórios.

---

# 6. Dashboard

Abra a opção **Dashboard** no menu lateral ou inferior.

O Dashboard mostra:

- venda estimada;
- gasto no CEASA;
- despesas;
- lucro bruto;
- lucro líquido;
- margens;
- comparação entre lojas.

## Como usar

1. Selecione a loja ou **Todas as lojas**.
2. Selecione o período.
3. Confira os cards de resumo.
4. Analise o comparativo entre Santa Rita e Taquari.

## Cálculos principais

- Lucro bruto estimado = venda estimada - compras CEASA.
- Lucro líquido estimado = venda estimada - compras CEASA - despesas.
- Margem líquida = lucro líquido ÷ venda estimada × 100.

---

# 7. Como cadastrar um produto

1. Selecione uma loja específica no topo.
2. Abra **Lista**.
3. Clique em **Cadastrar produto**.
4. Informe o nome do produto.
5. Informe uma categoria válida:

   - fruta;
   - verdura;
   - legume;
   - tempero;
   - outros.

6. Confirme o cadastro.

O produto será cadastrado para a loja selecionada.

## Atenção

Produtos da Santa Rita e produtos do Taquari são separados. Se necessário, cadastre o mesmo produto nas duas lojas.

---

# 8. Como criar uma lista de compra

1. Selecione **Santa Rita** ou **Taquari**.
2. Abra **Lista**.
3. Clique em **Nova lista**.
4. Informe o nome da lista.

   Exemplo: `Compra CEASA 13/06/2026`.

5. Confirme.
6. A nova lista será aberta automaticamente.

Criar uma nova lista não apaga as listas anteriores. Elas permanecem disponíveis em **Listas**.

---

# 9. Como adicionar produtos à lista

1. Abra **Lista**.
2. Role até a seção **Adicionar produto à lista**.
3. Localize o produto desejado.
4. Clique em **Adicionar**.
5. Repita o procedimento para todos os produtos necessários.

## Buscar produto

Use o campo **Buscar produto** para localizar rapidamente um item.

## Filtrar por categoria

Use o seletor de categoria para mostrar somente frutas, verduras, legumes, temperos ou outros.

---

# 10. Como planejar uma compra

1. Na lista aberta, localize o produto.
2. Clique em **Planejar**.
3. Informe a quantidade desejada.
4. Confirme.

## Remover produto da compra

1. Localize o produto.
2. Clique em **Remover**.
3. O produto será marcado como **Não comprar**.

Esse processo não exclui o produto do cadastro geral.

## Como remover um produto somente da lista atual

1. Localize o card do produto.
2. Clique em **Remover**.
3. Confirme a mensagem:

   `Tem certeza que deseja remover este produto da lista?`

4. O item sairá somente da lista aberta.
5. O produto continuará disponível no cadastro geral e poderá ser adicionado novamente.
6. A quantidade de itens e os totais serão atualizados automaticamente.

## Como alterar a ordem dos produtos

Existem quatro maneiras de organizar a lista:

1. No computador, clique e arraste o card para a posição desejada.
2. No celular, pressione o ícone de arrastar e mova o dedo até outro card.
3. Clique em **Subir** ou **Descer**.
4. Informe um número no campo **Mover para**.

A ordem é salva automaticamente e pertence somente à lista e à loja atuais. Busca e filtros não alteram a posição salva.

---

# 11. Tela do comprador no CEASA

1. Selecione a loja correta.
2. Abra **Comprar**.
3. Localize o produto.
4. Preencha:

   - quantidade comprada;
   - peso em quilos;
   - valor total pago;
   - qualidade;
   - observação.

5. Clique em **Marcar comprado**.
6. Repita para todos os produtos.

O sistema calcula automaticamente:

- custo base;
- preço sugerido;
- total gasto;
- venda estimada;
- lucro bruto estimado.

## Finalizar compra

1. Confira todos os produtos.
2. Confira pesos, quantidades e valores.
3. Clique em **Finalizar compra**.
4. Confirme a finalização.

Após finalizar, a lista fica disponível para consulta no histórico.

---

## Como configurar a precificação de um produto

1. Abra uma lista de compra que esteja aberta.
2. Localize o produto.
3. Clique em **Configurar preço** dentro do card.
4. Escolha o tipo:

   - **Por margem percentual**: mantém a regra percentual do sistema;
   - **Por valor fixo adicionado**: soma o valor fixo ao valor pago e divide pelo peso.

5. Confira ou informe o valor pago.
6. Informe o peso total.
7. Informe a margem percentual ou o valor fixo adicionado.
8. Escolha o arredondamento:

   - sem arredondar;
   - final 0,99;
   - final 0,49;
   - final 0,90;
   - automático comercial.

9. Saia do campo alterado para salvar.
10. Confira o preço sugerido exibido no painel e no card.

Na precificação por valor fixo, a fórmula é:

`Preço sugerido = (valor pago + valor fixo adicionado) ÷ peso total`

Se o valor pago ou o peso necessário não estiver informado, o painel mostrará um alerta e não calculará o preço.

# 12. Histórico das listas

1. Abra **Listas**.
2. O sistema exibirá as últimas 20 listas da loja selecionada.
3. Localize a lista desejada.
4. Clique em **Abrir lista**.

As listas abertas e finalizadas são identificadas pelo status.

---

# 13. Relatórios CEASA

1. Selecione a loja ou **Todas as lojas**.
2. Selecione o período.
3. Abra **Relatórios**.

O relatório mostra:

- total gasto;
- venda estimada;
- lucro bruto;
- margem;
- produtos mais caros;
- produtos com menor lucro estimado.

## Imprimir ou salvar PDF

1. Abra a tela que deseja imprimir.
2. Clique em **Imprimir / PDF**.
3. Na janela do navegador, selecione uma impressora ou **Salvar como PDF**.
4. Confirme.

---

# 14. Centro Financeiro

O Centro Financeiro está disponível para administradores e gerentes.

1. Selecione a loja ou **Todas as lojas**.
2. Selecione o período.
3. Abra **Centro Financeiro**.

As abas disponíveis são:

- Centro Financeiro;
- Entradas;
- Despesas;
- Fluxo de Caixa;
- Faturamento Diário;
- Caixa Diário;
- Resultado do Mês.

---

# 15. Visão geral do Centro Financeiro

Abra a aba **Centro Financeiro**.

A tela mostra:

- faturamento;
- compras CEASA;
- despesas;
- lucro bruto;
- lucro líquido;
- margem líquida;
- saldo de caixa;
- alertas automáticos;
- entradas versus saídas;
- comparativo entre lojas;
- evolução financeira.

## Alertas automáticos

O sistema pode mostrar:

- contas vencidas;
- contas a vencer;
- caixa negativo;
- margem abaixo do esperado;
- faturamento ainda não lançado.

Sempre investigue os alertas antes de encerrar o dia.

---

# 16. Como cadastrar uma entrada financeira

Use a aba **Entradas** para registrar recebimentos que precisam entrar no fluxo de caixa.

Exemplos:

- vendas;
- PIX recebido;
- dinheiro recebido;
- transferência;
- aporte do proprietário;
- outros recebimentos.

## Cadastrar entrada

1. Abra **Centro Financeiro > Entradas**.
2. Se estiver visualizando **Todas as lojas**, selecione a loja no formulário.
3. Informe a data.
4. Selecione a categoria.
5. Informe a descrição.
6. Informe o valor.
7. Selecione a forma de recebimento.
8. Se necessário, escolha um comprovante.
9. Informe uma observação.
10. Clique em **Salvar entrada**.

## Editar entrada

1. Localize a entrada.
2. Clique em **Editar**.
3. Altere os campos.
4. Clique em **Salvar entrada**.

## Excluir entrada

1. Localize a entrada.
2. Clique em **Excluir**.
3. Confirme a exclusão.

## Buscar e filtrar entradas

1. Digite no campo **Buscar entrada**.
2. Use o seletor de categoria.
3. Use o período global no topo.
4. Use o seletor de loja.

## Exportar entradas

1. Aplique os filtros desejados.
2. Clique em **Exportar Excel**.
3. O navegador baixará um arquivo CSV compatível com Excel.

---

# 17. Como cadastrar uma despesa

1. Abra **Centro Financeiro > Despesas**.
2. Se estiver em **Todas as lojas**, selecione a loja no formulário.
3. Informe a data.
4. Selecione a categoria.
5. Informe a descrição.
6. Informe o valor.
7. Selecione a forma de pagamento.
8. Escolha o status:

   - pago;
   - pendente;
   - vencido.

9. Adicione o comprovante, se disponível.
10. Informe uma observação.
11. Clique em **Cadastrar despesa**.

## Editar despesa

1. Localize a despesa.
2. Clique em **Editar**.
3. Faça as alterações.
4. Clique em **Salvar alterações**.

## Excluir despesa

1. Localize a despesa.
2. Clique em **Excluir**.
3. Leia a confirmação.
4. Confirme.

A exclusão fica registrada no histórico de alterações.

## Total por categoria e loja

Na tela de despesas, consulte os gráficos:

- total por categoria;
- total por loja.

---

# 18. Fluxo de Caixa

Abra **Centro Financeiro > Fluxo de Caixa**.

O fluxo reúne automaticamente:

- entradas financeiras;
- despesas;
- faturamentos diários.

A tela mostra:

- faturamento;
- compras CEASA;
- despesas;
- lucro bruto;
- lucro líquido;
- margem líquida;
- saldo;
- evolução diária;
- saldo acumulado;
- lista de movimentações.

## Como conferir

1. Selecione a loja.
2. Selecione o período.
3. Confira as entradas.
4. Confira as saídas.
5. Confira o saldo acumulado.
6. Investigue movimentações incorretas nas abas **Entradas**, **Despesas** ou **Faturamento Diário**.

---

# 19. Faturamento Diário

Use esta tela para registrar o fechamento de vendas do dia.

1. Abra **Centro Financeiro > Faturamento Diário**.
2. Informe a data.
3. Se necessário, selecione a loja.
4. Informe:

   - dinheiro;
   - PIX;
   - cartão de débito;
   - cartão de crédito;
   - outros.

5. Confira o faturamento total calculado.
6. Clique em **Salvar faturamento**.

Se já existir um faturamento para a mesma loja e data, o sistema atualizará o lançamento.

## Boas práticas

- Faça o lançamento diariamente.
- Use os valores dos relatórios da maquininha e do PIX.
- Confira o dinheiro contado antes de salvar.
- Não registre o mesmo faturamento também como entrada avulsa, pois isso duplicará o saldo do fluxo de caixa.

---

# 20. Caixa Diário

## Abertura de caixa

1. Abra **Centro Financeiro > Caixa Diário**.
2. Na seção **Abertura de caixa**, informe a data.
3. Se necessário, selecione a loja.
4. Informe o valor inicial disponível no caixa.
5. Clique em **Salvar abertura**.

## Fechamento de caixa

1. Na seção **Fechamento de caixa**, informe a data.
2. Se necessário, selecione a loja.
3. Confira o **Total esperado** calculado pelo sistema.
4. Informe:

   - dinheiro contado;
   - PIX recebido;
   - débito;
   - crédito;
   - outras entradas.

5. Confira o total informado.
6. Confira a diferença.
7. Clique em **Salvar fechamento**.

## Cálculo do total esperado

O sistema calcula:

`Abertura + Entradas - Despesas = Total esperado`

## Divergência

Quando o total informado for diferente do total esperado, a diferença será destacada.

Antes de salvar uma divergência:

1. confira o dinheiro contado;
2. confira os recebimentos;
3. confira as despesas;
4. confira se algum lançamento foi duplicado;
5. registre uma observação explicando a diferença.

---

# 21. Resultado do Mês

Abra **Centro Financeiro > Resultado do Mês**.

A tela calcula:

- faturamento;
- compras CEASA;
- despesas operacionais;
- lucro operacional;
- impostos;
- lucro líquido;
- margem líquida.

## Fórmulas

- Lucro operacional = faturamento - compras CEASA - despesas operacionais.
- Lucro líquido = lucro operacional - impostos.
- Margem líquida = lucro líquido ÷ faturamento × 100.

Use o filtro de período e loja para analisar resultados diferentes.

---

# 22. Como alterar margens de venda

1. Entre como administrador.
2. Abra **Ajustes**.
3. Localize **Margens por categoria**.
4. Altere o valor da categoria desejada.
5. Saia do campo para salvar.

As margens são utilizadas para sugerir preços de venda.

---

# 23. Como cadastrar uma loja

1. Entre como administrador.
2. Abra **Ajustes**.
3. Clique em **Cadastrar loja**.
4. Informe o nome.
5. Confirme.

As lojas iniciais são:

- Santa Rita;
- Taquari.

---

# 24. Como criar um usuário

1. Abra o Supabase.
2. Entre no projeto do Verdurão Ribeiro.
3. Abra **Authentication > Users**.
4. Clique em **Add user**.
5. Informe o e-mail em letras minúsculas.
6. Informe uma senha.
7. Crie o usuário.

Após criar o usuário, configure seu perfil e loja.

---

# 25. Como transformar um usuário em administrador

1. No Supabase, abra **SQL Editor**.
2. Crie uma nova consulta.
3. Substitua o e-mail no comando:

```sql
update public.profiles
set role = 'administrador'
where id = (
  select id
  from auth.users
  where email = 'email@exemplo.com'
);
```

4. Clique em **Run**.

Use sempre o e-mail em letras minúsculas.

---

# 26. Como configurar gerente e loja

1. No Supabase, abra **SQL Editor**.
2. Substitua o e-mail e o nome da loja:

```sql
update public.profiles
set role = 'gerente',
    store_id = (select id from public.stores where name = 'Santa Rita')
where id = (
  select id
  from auth.users
  where email = 'gerente@exemplo.com'
);

insert into public.user_stores (user_id, store_id)
select u.id, s.id
from auth.users u, public.stores s
where u.email = 'gerente@exemplo.com'
  and s.name = 'Santa Rita'
on conflict do nothing;
```

3. Clique em **Run**.
4. Peça para o gerente sair e entrar novamente.
5. Confirme que ele visualiza somente a loja permitida.

Para usar Taquari, troque `Santa Rita` por `Taquari`.

---

# 27. Como configurar funcionário ou comprador

Use o comando abaixo, alterando o perfil:

```sql
update public.profiles
set role = 'funcionario',
    store_id = (select id from public.stores where name = 'Santa Rita')
where id = (
  select id
  from auth.users
  where email = 'usuario@exemplo.com'
);

insert into public.user_stores (user_id, store_id)
select u.id, s.id
from auth.users u, public.stores s
where u.email = 'usuario@exemplo.com'
  and s.name = 'Santa Rita'
on conflict do nothing;
```

Para comprador, troque:

```sql
role = 'funcionario'
```

por:

```sql
role = 'comprador'
```

---

# 28. Histórico de alterações

1. Entre como administrador.
2. Abra **Ajustes**.
3. Localize **Histórico de alterações**.

O histórico registra alterações importantes, incluindo mudanças e exclusões em dados financeiros e listas.

---

# 29. Modo escuro

1. Clique no botão circular no canto superior direito.
2. O sistema alternará entre modo claro e escuro.

O modo funciona em computador, tablet e celular.

---

# 30. Rotina recomendada da equipe

## Antes de ir ao CEASA

1. Funcionário ou gerente entra no sistema.
2. Seleciona a loja.
3. Cria uma nova lista.
4. Adiciona produtos.
5. Informa quantidades planejadas.

## Durante a compra no CEASA

1. Comprador entra pelo celular.
2. Seleciona a loja.
3. Abre **Comprar**.
4. Preenche quantidades, pesos, valores e qualidade.
5. Marca os produtos comprados.
6. Finaliza a compra.

## Durante o dia na loja

1. Gerente registra despesas.
2. Gerente registra entradas avulsas quando necessário.
3. Gerente acompanha alertas financeiros.

## No fechamento do dia

1. Gerente lança o faturamento diário.
2. Registra o fechamento do caixa.
3. Confere divergências.
4. Consulta o fluxo de caixa.

## No fechamento do mês

1. Administrador seleciona **Todas as lojas**.
2. Seleciona o mês desejado.
3. Confere o Dashboard.
4. Confere o Resultado do Mês.
5. Analisa Santa Rita e Taquari separadamente.
6. Exporta ou imprime os relatórios.

---

# 31. Como atualizar o banco de dados

As migrações devem ser executadas na ordem:

1. `supabase/schema.sql` para uma instalação nova;
2. `supabase/migrations/001_add_manager_role.sql`;
3. `supabase/migrations/002_multi_store_finance.sql`;
4. `supabase/migrations/003_complete_financial_management.sql`.
5. `supabase/migrations/004_list_item_sort_order.sql`.
6. `supabase/migrations/005_product_pricing_modes.sql`.

## Executar uma migração

1. Abra o arquivo no computador.
2. Selecione e copie todo o conteúdo.
3. Abra **Supabase > SQL Editor**.
4. Clique em **New query**.
5. Cole o conteúdo.
6. Clique em **Run**.
7. Se aparecer um aviso sobre RLS, escolha **Execute e ative o RLS**.
8. Aguarde a mensagem de sucesso.

Não apague tabelas e não execute comandos destrutivos.

---

# 32. Como atualizar o sistema no GitHub e Vercel

## Arquivos que não devem ser enviados

Nunca envie:

- `.env`;
- `.env.local`;
- pasta `node_modules`;
- pasta `dist`.

## Validar antes de publicar

Abra o PowerShell na pasta do projeto:

```powershell
cd "C:\Users\hygoo\Documents\Codex\2026-06-12\quero-que-voc-crie-um-aplicativo\outputs\ceasa-app"
```

Execute:

```powershell
npm install
npm run build
npm run lint
```

O resultado esperado é:

- build concluído;
- pasta `dist` criada;
- lint sem erros.

## Publicar

1. Envie os arquivos alterados ao repositório GitHub.
2. Aguarde a Vercel detectar a alteração.
3. Abra o projeto na Vercel.
4. Aguarde o status **Ready**.
5. Abra a URL publicada.
6. Faça login e teste.

---

# 33. Teste completo depois de uma atualização

1. Abra o sistema em janela anônima.
2. Entre como administrador.
3. Selecione Santa Rita.
4. Crie uma lista.
5. Adicione um produto.
6. Abra a lista como comprador.
7. Preencha o produto e finalize.
8. Cadastre uma entrada de R$ 100,00.
9. Cadastre uma despesa de R$ 30,00.
10. Confira o fluxo de caixa.
11. Lance faturamento diário.
12. Faça abertura e fechamento de caixa.
13. Confira o Resultado do Mês.
14. Troque para Taquari.
15. Confirme que os dados são separados.
16. Selecione **Todas as lojas**.
17. Confira o consolidado.
18. Entre como gerente.
19. Confirme que o gerente acessa somente sua loja.
20. Entre como funcionário e comprador para confirmar as permissões.

---

# 34. Solução de problemas

## `npm install` informa que não encontrou `package.json`

Você está na pasta errada.

Execute:

```powershell
cd "C:\Users\hygoo\Documents\Codex\2026-06-12\quero-que-voc-crie-um-aplicativo\outputs\ceasa-app"
npm install
```

## Usuário continua como funcionário

1. Use o e-mail em letras minúsculas no SQL.
2. Execute novamente a alteração do perfil.
3. Peça para o usuário sair e entrar.

## E-mail já cadastrado

O usuário ainda existe no Supabase Authentication.

1. Abra **Authentication > Users**.
2. Procure o e-mail.
3. Edite o usuário existente ou exclua corretamente antes de criar novamente.

## Financeiro não aparece

O usuário precisa ser administrador ou gerente.

## Dados de uma loja não aparecem

1. Confira a loja selecionada.
2. Confira o período.
3. Confira o vínculo na tabela `user_stores`.
4. Confira o campo `store_id` do perfil.

## Fluxo de caixa parece duplicado

Confira se o faturamento do dia também foi cadastrado manualmente como entrada. Use:

- **Faturamento Diário** para o fechamento normal da loja;
- **Entradas** para recebimentos avulsos.

## Build falhou

Execute:

```powershell
npm install
npm run build
npm run lint
```

Leia a primeira mensagem de erro apresentada.

---

# 35. Segurança

- Nunca compartilhe a senha do Supabase.
- Nunca envie a chave `service_role` ao GitHub.
- Use somente a chave publicável nas variáveis `VITE_*`.
- Nunca envie arquivos `.env`.
- Crie um usuário separado para cada pessoa.
- Remova acessos de pessoas que não trabalham mais na empresa.
- Revise periodicamente os perfis e lojas permitidas.
- Faça conferências financeiras diariamente.

---

# 36. Resumo dos principais caminhos

| Objetivo | Caminho |
|---|---|
| Criar lista CEASA | Loja > Lista > Nova lista |
| Adicionar produto | Loja > Lista > Adicionar produto |
| Preencher compra | Loja > Comprar |
| Consultar listas antigas | Loja > Listas |
| Ver relatórios CEASA | Relatórios |
| Cadastrar entrada | Centro Financeiro > Entradas |
| Cadastrar despesa | Centro Financeiro > Despesas |
| Conferir saldo | Centro Financeiro > Fluxo de Caixa |
| Lançar vendas do dia | Centro Financeiro > Faturamento Diário |
| Abrir ou fechar caixa | Centro Financeiro > Caixa Diário |
| Consultar lucro líquido | Centro Financeiro > Resultado do Mês |
| Cadastrar loja | Ajustes > Cadastrar loja |
| Alterar margem | Ajustes > Margens por categoria |
| Criar usuário | Supabase > Authentication > Users |
| Alterar perfil | Supabase > SQL Editor |

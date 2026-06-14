# Verdurão Ribeiro

### Plataforma web para controle de compras no CEASA e gestão financeira multi-loja

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

O **Verdurão Ribeiro** é uma aplicação responsiva desenvolvida para organizar compras no CEASA, calcular custos e preços sugeridos, acompanhar resultados financeiros e administrar múltiplas lojas em uma única plataforma.

O projeto utiliza autenticação, sincronização em tempo real, permissões por perfil e segurança em nível de linha no banco de dados.

## Funcionalidades

### Compras CEASA

- Criação e planejamento de listas de compras.
- Catálogo separado por loja.
- Busca rápida e filtros por categoria.
- Tela otimizada para o comprador usar no celular.
- Registro de quantidade, peso, valor pago, qualidade e observações.
- Cálculo automático de custo, preço sugerido, lucro e margem.
- Histórico das últimas listas.
- Atualização em tempo real entre loja e comprador.

### Gestão financeira

- Cadastro de entradas e despesas.
- Upload privado de comprovantes.
- Fluxo de caixa automático.
- Faturamento diário por forma de recebimento.
- Abertura e fechamento de caixa.
- Alerta visual para divergências.
- Resultado financeiro e lucro líquido.
- Alertas para contas vencidas, caixa negativo e margem baixa.
- Exportação para Excel, impressão e PDF.

### Multi-loja

- Dados separados por loja.
- Visão consolidada para administradores.
- Comparação entre lojas.
- Relatórios e indicadores por período.
- Lojas iniciais: Santa Rita e Taquari.

### Perfis de acesso

| Perfil | Acesso |
|---|---|
| Administrador | Todas as lojas, dashboards, financeiro, configurações e auditoria |
| Gerente | Operação e financeiro somente das lojas autorizadas |
| Funcionário | Cadastro de produtos e planejamento das listas |
| Comprador | Preenchimento e finalização das compras no CEASA |

As permissões são aplicadas no banco com **Row Level Security**, não apenas escondidas na interface.

## Tecnologias

- React 19
- Vite 6
- Supabase Auth
- PostgreSQL
- Supabase Realtime
- Supabase Storage
- Row Level Security
- Vercel
- CSS responsivo

## Arquitetura

```text
ceasa-app/
├── public/                         Arquivos públicos e identidade visual
├── src/
│   ├── App.jsx                     Navegação, autenticação e compras CEASA
│   ├── Dashboard.jsx               Indicadores e comparativos
│   ├── Finance.jsx                 Controle de despesas
│   ├── FinanceCenter.jsx           Centro financeiro completo
│   ├── constants.js                Cálculos e regras
│   ├── main.jsx                    Inicialização React
│   └── supabase.js                 Cliente Supabase
├── supabase/
│   ├── schema.sql                  Estrutura inicial do banco
│   └── migrations/                 Migrações incrementais e seguras
├── styles.css                      Estilos responsivos e modo escuro
├── vercel.json                     Build e fallback SPA
└── .env.example                    Modelo das variáveis de ambiente
```

## Executar localmente

### Requisitos

- Node.js 20 ou superior.
- Um projeto no Supabase.

### Instalação

```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd SEU-REPOSITORIO
npm install
```

Crie um arquivo `.env.local` baseado em `.env.example`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUA_AQUI
```

Inicie o ambiente local:

```bash
npm run dev
```

Valide a versão de produção:

```bash
npm run build
npm run lint
npm run preview
```

A saída de produção será criada em `dist`.

## Configurar o Supabase

### Instalação nova

1. Crie um projeto no [Supabase](https://database.new/).
2. Abra **SQL Editor**.
3. Execute `supabase/schema.sql`.
4. Execute as migrações, na ordem:

```text
supabase/migrations/001_add_manager_role.sql
supabase/migrations/002_multi_store_finance.sql
supabase/migrations/003_complete_financial_management.sql
supabase/migrations/004_list_item_sort_order.sql
supabase/migrations/005_product_pricing_modes.sql
supabase/migrations/006_store_list_templates.sql
supabase/migrations/007_copy_taquari_template_to_santa_rita.sql
supabase/migrations/008_product_calculation_type.sql
```

5. Em **Authentication > Providers**, mantenha o login por e-mail habilitado.
6. Em produção, desabilite o cadastro público e crie usuários autorizados manualmente.

As migrações são incrementais e preservam os dados existentes.

A migração `004_list_item_sort_order.sql` adiciona a ordem personalizada dos produtos em cada lista, permitindo remover itens somente da lista atual e reorganizá-los sem alterar o cadastro geral.

A migração `005_product_pricing_modes.sql` adiciona precificação por margem percentual ou valor fixo, com arredondamento configurável por item.

A migração `006_store_list_templates.sql` permite escolher uma lista base diferente para cada loja. Ao criar uma nova lista, os produtos planejados, a ordem e as configurações de preço são copiados, enquanto os dados da compra permanecem zerados.

A migração `007_copy_taquari_template_to_santa_rita.sql` copia a lista base de Taquari para Santa Rita, cria os produtos equivalentes que estiverem faltando e define a cópia como lista base de Santa Rita.

A migração `008_product_calculation_type.sql` separa produtos calculados por KG e UNIDADE, preservando os dados existentes e classificando automaticamente produtos antigos.

### Criar o primeiro administrador

Crie o usuário em **Authentication > Users** e execute:

```sql
update public.profiles
set role = 'administrador'
where id = (
  select id
  from auth.users
  where email = 'administrador@exemplo.com'
);
```

Utilize e-mails em letras minúsculas.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável usada pelo frontend |

> Nunca coloque a chave `service_role`, Secret key, senhas ou credenciais privadas em variáveis `VITE_*`.

## Deploy na Vercel

1. Importe o repositório na [Vercel](https://vercel.com/new).
2. Selecione o preset **Vite**.
3. Confirme:

```text
Build Command: npm run build
Output Directory: dist
```

4. Cadastre as variáveis:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

5. Clique em **Deploy**.

O arquivo `vercel.json` configura o fallback necessário para evitar erros 404 em rotas SPA.

### URLs de autenticação

Em **Supabase > Authentication > URL Configuration**:

- configure **Site URL** com a URL de produção;
- adicione `http://localhost:5173/**` para desenvolvimento;
- adicione `https://SEU-DOMINIO.vercel.app/**` para produção.

## Segurança

Este projeto utiliza:

- autenticação por e-mail e senha;
- Row Level Security;
- permissões por perfil e loja;
- buckets privados para comprovantes;
- histórico de alterações;
- `.gitignore` configurado para não publicar arquivos sensíveis.

Antes de tornar o repositório público, confirme que os seguintes itens não estão versionados:

```text
.env
.env.local
.vercel/
node_modules/
dist/
```

Também pesquise o histórico do repositório para confirmar que nenhuma chave secreta foi enviada anteriormente. Se alguma chave privada já tiver sido publicada, substitua-a no Supabase antes de tornar o repositório público.

## Documentação

- [Manual completo do sistema](./MANUAL_COMPLETO_DO_SISTEMA.md)
- [Guia do Centro Financeiro](./GUIA_CENTRO_FINANCEIRO.md)
- [Guia de lojas, financeiro e permissões](./GUIA_FINANCEIRO_E_LOJAS.md)

## Scripts

| Comando | Ação |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run lint` | Valida a qualidade do código |
| `npm run preview` | Visualiza localmente o build de produção |

## Testes recomendados

Antes de uma publicação:

1. Execute `npm run build` e `npm run lint`.
2. Teste o login de cada perfil.
3. Crie e finalize uma lista CEASA.
4. Teste a sincronização em dois dispositivos.
5. Cadastre uma entrada e uma despesa.
6. Confira o fluxo de caixa e o resultado.
7. Confirme que gerentes acessam somente suas lojas.
8. Confirme que funcionários e compradores não acessam o financeiro.

## Status

Projeto em desenvolvimento ativo, utilizado para apoiar a operação do Verdurão Ribeiro.

## Licença

Este repositório não possui uma licença de código aberto definida. A disponibilização pública do código não concede automaticamente permissão para copiar, modificar, distribuir ou utilizar comercialmente o projeto.

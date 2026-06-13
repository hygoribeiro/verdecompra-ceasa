# Verdurão Ribeiro - Controle CEASA

O sistema inclui operação multi-loja, módulo financeiro, dashboards geral/individual, comprovantes e histórico de alterações.

## Atualizar uma instalação existente

Execute no SQL Editor:

```text
supabase/migrations/002_multi_store_finance.sql
```

A migração preserva os dados atuais. Consulte `GUIA_FINANCEIRO_E_LOJAS.md`.

Aplicativo React/Vite para controle colaborativo de compras no CEASA, com autenticação, banco PostgreSQL, permissões por perfil e sincronização em tempo real via Supabase.

## Stack e build

- React 19 + Vite
- Supabase Auth, PostgreSQL, RLS e Realtime
- Deploy preparado para Vercel
- Build: `npm run build`
- Saída de produção: `dist`
- SPA fallback: configurado em `vercel.json`

## Rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` antes de iniciar:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUBSTITUA_AQUI
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## 1. Criar e configurar o projeto no Supabase

1. Acesse [database.new](https://database.new) e crie um projeto.
2. No painel do projeto, abra **SQL Editor**.
3. Copie todo o conteúdo de `supabase/schema.sql`, cole no editor e execute uma vez.
4. Em **Authentication > Providers > Email**, mantenha Email habilitado.
5. Para produção, desative cadastros públicos ou use somente convites em **Authentication**, evitando que pessoas não autorizadas criem contas.
6. Crie o primeiro usuário em **Authentication > Users > Add user**.
7. Depois que esse usuário existir, execute no SQL Editor:

```sql
update public.profiles
set role = 'administrador'
where id = (select id from auth.users where email = 'SEU_EMAIL@EXEMPLO.COM');
```

8. Crie os demais usuários e altere seus perfis quando necessário:

```sql
update public.profiles
set role = 'comprador'
where id = (select id from auth.users where email = 'comprador@exemplo.com');

update public.profiles
set role = 'funcionario'
where id = (select id from auth.users where email = 'funcionario@exemplo.com');
```

O arquivo SQL cria tabelas, índices, 20 produtos de exemplo, margens, triggers, políticas RLS e publicação Realtime.

### Permissões

| Perfil | Permissões |
|---|---|
| Administrador | Acesso completo, margens, usuários e exclusões |
| Funcionário | Cadastra produtos, cria listas e altera planejamento |
| Comprador | Preenche quantidade, peso, valor, qualidade e status comprado |

Todos precisam estar autenticados. As regras são aplicadas no banco com RLS e triggers, não apenas escondidas na interface.

## 2. Configurar variáveis de ambiente

No Supabase, abra o botão **Connect** do projeto e copie:

- Project URL para `VITE_SUPABASE_URL`
- Publishable key para `VITE_SUPABASE_PUBLISHABLE_KEY`

Use somente a chave publicável no frontend. Nunca coloque uma Secret key ou `service_role` em variáveis `VITE_*`.

Para desenvolvimento, crie `.env.local` a partir de `.env.example`. Esse arquivo é ignorado pelo Git.

## 3. Subir na Vercel

1. Envie esta pasta para um repositório GitHub, GitLab ou Bitbucket.
2. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório.
3. Confirme as configurações:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Marque Production, Preview e Development conforme necessário.
6. Clique em **Deploy**.

O `vercel.json` já contém o rewrite necessário para que rotas SPA não retornem erro 404.

## 4. Configurar URLs de autenticação

No Supabase, abra **Authentication > URL Configuration**:

1. Defina **Site URL** como a URL final da Vercel, por exemplo `https://verdecompra.vercel.app`.
2. Adicione em **Redirect URLs**:
   - `http://localhost:5173/**`
   - `https://SEU-DOMINIO.vercel.app/**`
   - Seu domínio próprio, caso exista.

## 5. Testar o app online

1. Abra a URL publicada em uma janela anônima e confirme que o app exige login.
2. Entre como funcionário, crie uma lista e adicione um produto.
3. Em outro navegador ou celular, entre como comprador.
4. Altere peso e valor no perfil comprador e confirme que a lista atualiza no primeiro navegador sem recarregar.
5. Tente cadastrar um produto como comprador; a interface deve bloquear.
6. Tente alterar valores da compra como funcionário; o banco deve rejeitar.
7. Atualize uma URL interna diretamente e confirme que a Vercel não retorna 404.
8. Execute localmente `npm run build` antes de cada publicação importante.

## Estrutura

```text
src/
  App.jsx          Interface e fluxos
  constants.js     Cálculos e regras
  main.jsx         Entrada React
  supabase.js      Cliente Supabase
supabase/
  schema.sql       Banco, RLS, triggers, realtime e dados iniciais
vercel.json        Build e fallback SPA
.env.example       Variáveis necessárias
```

## Segurança importante

- A chave publicável pode ficar no navegador porque o acesso é protegido por RLS.
- Nunca exponha a Secret key ou a chave legada `service_role`.
- Em produção, prefira criar usuários por convite e desabilitar signup público.
- Revise periodicamente os usuários em `public.profiles` e remova acessos que não forem mais necessários.

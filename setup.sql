-- ================================================================
-- REVENDÊ — Setup completo do banco de dados
-- Supabase → SQL Editor → New query → Run
-- ================================================================

create extension if not exists "uuid-ossp";

-- ── VENDAS ──────────────────────────────────────────────────────
create table if not exists vendas (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  data        text,
  produto     text not null,
  custo       numeric not null check (custo >= 0),
  venda       numeric not null check (venda >= 0),
  lucro       numeric generated always as (venda - custo) stored,
  margem      numeric generated always as (
                case when venda > 0 then ((venda - custo) / venda) * 100 else 0 end
              ) stored,
  marketplace text default 'Outro',
  status      text default 'lucro' check (status in ('lucro','pendente','prejuizo')),
  foto_url    text,
  notas       text,
  criado_em   bigint default extract(epoch from now())::bigint * 1000
);
alter table vendas enable row level security;
drop policy if exists "own_vendas" on vendas;
create policy "own_vendas" on vendas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_vendas_user_id on vendas(user_id);
create index if not exists idx_vendas_criado_em on vendas(criado_em desc);

-- ── PRODUTOS ────────────────────────────────────────────────────
create table if not exists produtos (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  nome         text not null,
  descricao    text,
  categoria    text default 'Outro',
  fornecedor   text,
  custo        numeric not null check (custo >= 0),
  venda        numeric not null check (venda >= 0),
  lucro_unit   numeric generated always as (venda - custo) stored,
  margem       numeric generated always as (
                 case when venda > 0 then ((venda - custo) / venda) * 100 else 0 end
               ) stored,
  estoque      integer default 0 check (estoque >= 0),
  estoque_min  integer default 2 check (estoque_min >= 0),
  foto_url     text,
  obs          text,
  ativo        boolean default true,
  criado_em    bigint default extract(epoch from now())::bigint * 1000,
  atualizado_em bigint default extract(epoch from now())::bigint * 1000
);

-- Adiciona coluna se nao existir (caso a tabela ja tenha sido criada)
alter table produtos add column if not exists atualizado_em bigint default extract(epoch from now())::bigint * 1000;
alter table produtos drop column if exists lucro_unit;
alter table produtos drop column if exists margem;

-- Remove colunas generated das vendas se existirem (causando null)
alter table vendas drop column if exists lucro;
alter table vendas drop column if exists margem;
alter table produtos enable row level security;
drop policy if exists "own_produtos" on produtos;
create policy "own_produtos" on produtos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_produtos_user_id on produtos(user_id);

-- ── HISTORICO ───────────────────────────────────────────────────
create table if not exists historico (
  id       uuid default uuid_generate_v4() primary key,
  user_id  uuid references auth.users(id) on delete cascade not null,
  acao     text not null check (acao in ('criado','editado','removido')),
  entidade text not null,
  detalhe  text,
  usuario  text,
  ts       bigint default extract(epoch from now())::bigint * 1000
);
alter table historico enable row level security;
drop policy if exists "own_historico" on historico;
create policy "own_historico" on historico for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_historico_user_ts on historico(user_id, ts desc);

-- ── CONFIG ──────────────────────────────────────────────────────
create table if not exists config (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  meta_mensal numeric default 500 check (meta_mensal > 0),
  moeda       text default 'BRL',
  tema        text default 'dark',
  atualizado_em bigint default extract(epoch from now())::bigint * 1000
);
alter table config enable row level security;
drop policy if exists "own_config" on config;
create policy "own_config" on config for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ================================================================
-- STORAGE POLICIES — bucket "produtos"
-- ATENÇÃO: Crie o bucket ANTES de rodar estas policies:
--   Storage → New bucket → nome: produtos → Public bucket ✓
-- ================================================================

drop policy if exists "storage_insert" on storage.objects;
create policy "storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'produtos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_update" on storage.objects;
create policy "storage_update" on storage.objects
  for update using (
    bucket_id = 'produtos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_delete" on storage.objects;
create policy "storage_delete" on storage.objects
  for delete using (
    bucket_id = 'produtos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_select" on storage.objects;
create policy "storage_select" on storage.objects
  for select using (bucket_id = 'produtos');

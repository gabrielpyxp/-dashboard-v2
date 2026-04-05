# Revendê — Dashboard de Revendas

> Sistema completo para gerenciar compras, vendas e lucros de revendedor autônomo. Com banco de dados em tempo real, autenticação segura, upload de fotos, geração de títulos por IA e arquitetura modular profissional.

---

## ✨ Funcionalidades

| Módulo | Funcionalidades |
|---|---|
| **Auth** | Login/cadastro por email e senha, recuperação de senha, sessão persistente |
| **Dashboard** | KPIs em tempo real: receita, lucro, margem, total de vendas, gráficos, meta mensal |
| **Vendas** | Registro com custo, preço, marketplace, status, foto e rascunho automático |
| **Catálogo** | Produtos com foto, categoria, fornecedor, controle de estoque com alertas |
| **IA de Títulos** | Gera títulos e descrições via foto OU dados textuais. Painel dedicado na página "IA Agente" + integrado no modal de produto |
| **Análise** | Desempenho por produto: lucro total, margem, custo e preço médio |
| **Metas** | Meta mensal com barra de progresso e resumo financeiro |
| **Histórico** | Log completo de todas as ações (criado / editado / removido) |
| **Export CSV** | Exporta todas as vendas em planilha com um clique |

---

## 🗂️ Estrutura do projeto

```
Dashboard-vendas/
├── index.html                          # HTML semântico e acessível
├── setup.sql                           # Banco de dados + políticas de segurança
├── README.md
│
├── css/
│   └── styles.css                      # Design system completo
│
├── js/
│   ├── app.js                          # Orquestrador — eventos e navegação
│   ├── config.js                       # Cliente Supabase e constantes
│   ├── state.js                        # Estado global com pub/sub
│   │
│   ├── services/                       # Camada de dados
│   │   ├── auth.service.js             # Autenticação
│   │   ├── vendas.service.js           # CRUD de vendas
│   │   ├── produtos.service.js         # CRUD de produtos + storage
│   │   ├── historico.service.js        # Log de ações
│   │   ├── config.service.js           # Configurações do usuário
│   │   ├── realtime.service.js         # Sincronização em tempo real
│   │   └── ai.service.js              # Integração com IA (Edge Function)
│   │
│   ├── pages/                          # Renderização por página
│   │   ├── dashboard.js                # KPIs, tabela, gráficos, meta
│   │   ├── catalogo.js                 # Grid de produtos
│   │   ├── agente.js                   # Página Agente IA
│   │   └── other.js                   # Análise, Metas, Histórico, Vendas
│   │
│   ├── components/                     # Componentes reutilizáveis
│   │   ├── toast.js                    # Notificações
│   │   ├── charts.js                   # Gráficos Chart.js
│   │   └── imageUpload.js              # Upload e validação de imagem
│   │
│   └── utils/                          # Utilitários puros
│       ├── format.js                   # Formatação de números e datas
│       ├── security.js                 # Sanitização e validação
│       ├── dom.js                      # Helpers de DOM
│       └── draft.js                    # Rascunho automático
│
└── supabase/
    └── functions/
        └── ai-titles/
            └── index.ts                # Edge Function — proxy seguro para Claude API
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| [Supabase](https://supabase.com) | Auth, banco PostgreSQL, Storage, Realtime, Edge Functions |
| [Claude (Anthropic)](https://anthropic.com) | Geração de títulos e descrições de produtos |
| [Chart.js](https://chartjs.org) | Gráficos de lucro e distribuição de margem |
| ES Modules | JavaScript modular sem bundler |

---

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/gabrielpyxp/Dashboard-vendas.git
cd Dashboard-vendas
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. **SQL Editor → New query** → cole o conteúdo de `setup.sql` → **Run**
3. **Storage → New bucket** → nome: `produtos` → marque **Public bucket** → Save
4. **Authentication → Providers → Email** → confirme que está ativo
5. **Authentication → URL Configuration → Site URL** → cole a URL do GitHub Pages

### 3. Configure a URL do site (GitHub Pages)

Vá em **Settings → Pages → Branch: main → / (root) → Save**

Seu site estará em: `https://gabrielpyxp.github.io/Dashboard-vendas`

### 4. (Opcional) Deploy da Edge Function de IA

```bash
# Instala Supabase CLI
npm install -g supabase

# Login
supabase login

# Seta a chave da API do Claude como secret
supabase secrets set ANTHROPIC_API_KEY=sua-chave-aqui --project-ref cdsvcvknoticxpwvhrmi

# Deploy da função
supabase functions deploy ai-titles --project-ref cdsvcvknoticxpwvhrmi
```

---

## 🔐 Segurança

- **Row Level Security (RLS)** em todas as tabelas — cada usuário acessa apenas seus próprios dados
- **Storage policies** vinculadas ao `user_id` — uploads isolados por usuário
- **Sanitização XSS** em todas as entradas antes de exibir no HTML
- **Validação de imagem** por magic bytes (não apenas extensão)
- **Event delegation** centralizado — sem `onclick` inline
- **Edge Function** como proxy — chave da API do Claude nunca exposta no frontend
- **Índices** nas tabelas para queries eficientes

---

## 🤖 IA — Como funciona

1. Cadastre um produto e adicione uma foto
2. O painel de IA aparece automaticamente
3. Escolha 2 ou 3 sugestões
4. Clique em **✦ Gerar com IA**
5. Claude analisa a imagem + categoria + fornecedor + nome digitado
6. Gera títulos otimizados para Mercado Livre / Shopee
7. Clique em qualquer opção para aplicar

> A IA funciona via **Supabase Edge Function** — a chave da API fica segura no servidor.

---

## 🚀 Como atualizar

```bash
git add .
git commit -m "feat: descrição do que mudou"
git push origin main
```

---

## 📄 Licença

MIT

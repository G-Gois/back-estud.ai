# 🚀 Deploy na Internet

Este guia mostra como fazer deploy da API estud.ai em plataformas cloud gratuitas.

## 📋 Requisitos

Antes de fazer deploy, você precisa:
- ✅ Uma conta no GitHub (para conectar ao Railway/Render)
- ✅ Uma chave de API do OpenAI (`OPENAI_API_KEY`)
- ✅ Um `JWT_SECRET` forte (string aleatória de 32+ caracteres)

---

## 🚂 Opção 1: Deploy no Railway (Recomendado)

### Por que Railway?
- ✅ **Grátis**: $5 de crédito gratuito por mês
- ✅ **Banco PostgreSQL incluído**: Provisiona automaticamente
- ✅ **Deploy automático**: Push no GitHub = deploy automático
- ✅ **SSL grátis**: HTTPS configurado automaticamente

### Passo a Passo

#### 1. Preparar o repositório

```bash
# Se ainda não inicializou git
git init
git add .
git commit -m "Preparar para deploy"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

#### 2. Criar conta no Railway

1. Acesse: https://railway.app
2. Clique em "Start a New Project"
3. Faça login com GitHub

#### 3. Criar novo projeto

1. Clique em "New Project"
2. Escolha "Deploy from GitHub repo"
3. Selecione seu repositório
4. Railway detectará automaticamente que é um projeto Node.js

#### 4. Adicionar banco de dados PostgreSQL

1. No projeto, clique em "+ New"
2. Selecione "Database" → "PostgreSQL"
3. Railway criará automaticamente a variável `DATABASE_URL`

#### 5. Configurar variáveis de ambiente

1. Clique no serviço da API (node.js)
2. Vá em "Variables"
3. Adicione as seguintes variáveis:

```bash
NODE_ENV=production
JWT_SECRET=sua-chave-super-secreta-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-sua-chave-openai-aqui
DB_POOL_SIZE=10
```

**IMPORTANTE**:
- ❌ **NÃO** adicione `DATABASE_URL` - Railway adiciona automaticamente
- ❌ **NÃO** adicione `PORT` - Railway adiciona automaticamente
- ❌ **NÃO** adicione `HOST` - configurado automaticamente para `0.0.0.0` em produção

#### 6. Deploy!

O Railway fará deploy automaticamente! Aguarde alguns minutos.

#### 7. Obter URL pública

1. No serviço da API, vá em "Settings"
2. Role até "Networking"
3. Clique em "Generate Domain"
4. Sua API estará disponível em: `https://seu-app.up.railway.app`

#### 8. Testar

```bash
# Health check
curl https://seu-app.up.railway.app/api/health

# Ou abra no navegador:
https://seu-app.up.railway.app/api/health
```

#### 9. Rodar as migrations (IMPORTANTE!)

Você precisa criar as tabelas no banco de dados. Conecte-se ao banco:

1. No Railway, clique no serviço PostgreSQL
2. Vá em "Connect" e copie a `DATABASE_URL`
3. Use um cliente SQL (DBeaver, pgAdmin, ou psql) para conectar
4. Execute os scripts SQL da pasta `database/`:
   - `database/schema.sql` (cria as tabelas)
   - (adicione outros scripts se houver)

---

## 🎨 Opção 2: Deploy no Render

### Por que Render?
- ✅ **Grátis para sempre**: Plano gratuito sem expiração
- ✅ **Banco PostgreSQL incluído**: Gratuito (expira em 90 dias, mas pode renovar)
- ✅ **SSL grátis**: HTTPS automático
- ⚠️ **Desvantagem**: Serviços gratuitos "dormem" após 15min de inatividade (primeira requisição demora ~30s)

### Passo a Passo

#### 1. Preparar o repositório (igual Railway)

```bash
git init
git add .
git commit -m "Preparar para deploy"
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

#### 2. Criar conta no Render

1. Acesse: https://render.com
2. Faça login com GitHub

#### 3. Criar banco de dados PostgreSQL

1. No dashboard, clique em "New +"
2. Escolha "PostgreSQL"
3. Configure:
   - **Name**: `estud-ai-db`
   - **Database**: `estud_ai`
   - **User**: `estud_ai_user`
   - **Region**: escolha o mais próximo
   - **Plan**: Free
4. Clique em "Create Database"
5. Copie a **Internal Database URL** (vamos usar depois)

#### 4. Criar Web Service

1. Clique em "New +" → "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `estud-ai-api`
   - **Region**: mesma do banco
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 5. Configurar variáveis de ambiente

Na seção "Environment Variables", adicione:

```bash
NODE_ENV=production
DATABASE_URL=<cole-a-internal-database-url-aqui>
JWT_SECRET=sua-chave-super-secreta-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-sua-chave-openai-aqui
DB_POOL_SIZE=10
```

#### 6. Deploy!

Clique em "Create Web Service". O Render fará deploy automaticamente!

#### 7. Obter URL pública

Após o deploy, sua API estará em: `https://estud-ai-api.onrender.com`

#### 8. Testar

```bash
curl https://estud-ai-api.onrender.com/api/health
```

#### 9. Rodar migrations

Conecte-se ao banco usando a "External Database URL" do Render e execute os scripts SQL.

---

## 🔧 Variáveis de ambiente necessárias

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `NODE_ENV` | Ambiente | `production` | ✅ Sim |
| `DATABASE_URL` | URL do PostgreSQL | `postgres://user:pass@host:5432/db` | ✅ Sim (auto no Railway) |
| `JWT_SECRET` | Chave secreta JWT | `uma-string-aleatoria-muito-longa` | ✅ Sim |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` | ❌ Não (padrão: 7d) |
| `OPENAI_API_KEY` | Chave API OpenAI | `sk-proj-...` | ✅ Sim |
| `DB_POOL_SIZE` | Tamanho do pool de conexões | `10` | ❌ Não (padrão: 10) |
| `PORT` | Porta do servidor | `3000` | ❌ Não (auto no Railway/Render) |

---

## 📊 Custos

### Railway
- **Grátis**: $5/mês de crédito
- **Uso típico desta API**: ~$3-4/mês
- **Conclusão**: ✅ Provavelmente grátis se tiver pouco tráfego

### Render
- **Web Service Free**: 750h/mês (suficiente para 1 serviço rodando 24/7)
- **PostgreSQL Free**: 90 dias (depois precisa renovar ou pagar)
- **Conclusão**: ✅ Grátis, mas banco expira

---

## 🐛 Problemas comuns

### Erro: "Cannot connect to database"
- ✅ Verifique se `DATABASE_URL` está configurada
- ✅ No Railway: certifique-se que o serviço PostgreSQL está rodando
- ✅ No Render: use a "Internal Database URL", não a "External"

### Erro: "Port already in use"
- ✅ Não defina `PORT` nas variáveis - Railway/Render definem automaticamente

### API não responde / timeout
- ✅ Render free: primeira requisição demora ~30s (serviço estava dormindo)
- ✅ Aguarde e tente novamente

### Erro ao gerar questionário
- ✅ Verifique se `OPENAI_API_KEY` está correta
- ✅ Verifique se tem créditos na conta OpenAI

---

## 🔄 Atualizações automáticas

### Railway
- ✅ Push no GitHub = deploy automático
- Configure em: Settings → Deploy → Auto Deploy

### Render
- ✅ Push no GitHub = deploy automático
- Já vem ativado por padrão

---

## 📝 Próximos passos

Após deploy:
1. ✅ Teste os endpoints com Postman/Thunder Client
2. ✅ Configure CORS se precisar acessar de frontend
3. ✅ Configure domínio customizado (opcional)
4. ✅ Configure monitoramento (Railway/Render têm logs embutidos)

---

## 🆘 Suporte

- 📚 Railway Docs: https://docs.railway.app
- 📚 Render Docs: https://render.com/docs
- 💬 Dúvidas? Abra uma issue no GitHub!

# 🚀 Deploy Rápido - 5 Minutos

## Railway (Recomendado) ⚡

### 1. Fazer push no GitHub
```bash
git add .
git commit -m "Deploy"
git push
```

### 2. Criar projeto no Railway
1. Acesse: https://railway.app
2. Login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecione seu repositório

### 3. Adicionar PostgreSQL
1. No projeto: "+ New" → "Database" → "PostgreSQL"

### 4. Configurar variáveis
No serviço Node.js → "Variables":
```bash
NODE_ENV=production
JWT_SECRET=casdjiopasdads0-12i32j@ASDASDSAJIY--asdasdas-cdsgulhçklbcv
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

**IMPORTANTE**: Troque `JWT_SECRET` por uma string aleatória sua! Não use a do exemplo!

### 5. Gerar domínio público
Service → Settings → Networking → "Generate Domain"

### 6. Testar
```bash
curl https://seu-app.up.railway.app/api/health
```

### 7. Rodar migrations
1. PostgreSQL service → "Connect" → copiar DATABASE_URL
2. Conectar com cliente SQL (DBeaver/pgAdmin)
3. Executar scripts de `database/schema.sql`

## ✅ Pronto! Sua API está na internet!

---

## Render (Alternativa gratuita)

### Passos rápidos:
1. https://render.com → Login com GitHub
2. "New +" → "PostgreSQL" → Free → Copiar "Internal Database URL"
3. "New +" → "Web Service" → Escolher repo
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Environment Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<cole-url-copiada>
   JWT_SECRET=sua-chave-secreta
   OPENAI_API_KEY=sk-sua-chave
   ```
7. "Create Web Service"

⚠️ **Observação**: Render free "dorme" após 15min sem uso (primeira request demora 30s)

---

## 🆘 Problemas?

Veja o guia completo: [DEPLOY.md](./DEPLOY.md)

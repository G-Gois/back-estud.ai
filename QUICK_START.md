# Guia Rápido - Estud.AI Auth System

## 🚀 Iniciar o Servidor

### 1. Configurar o Banco de Dados

```bash
# Criar banco de dados
createdb estud_ai

# Executar schema
psql -d estud_ai -f database/database-start.sql
```

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
DB_PASSWORD=sua_senha_postgres
JWT_SECRET=uma-chave-secreta-forte-e-aleatoria
```

### 3. Iniciar em Modo Desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em: `http://localhost:3000`

## 📝 Testando a API

### Registrar Novo Usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva",
    "email": "joao@example.com",
    "senha": "senha123",
    "data_nascimento": "2000-01-01"
  }'
```

**Resposta:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Usuário registrado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": "uuid-here",
      "nome_completo": "João Silva",
      "email": "joao@example.com",
      "data_nascimento": "2000-01-01",
      "criado_em": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "senha": "senha123"
  }'
```

### Obter Perfil (Autenticado)

```bash
# Substitua SEU_TOKEN pelo token recebido no login
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Atualizar Perfil

```bash
curl -X PUT http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome_completo": "João Silva Santos"
  }'
```

### Deletar Conta

```bash
curl -X DELETE http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🔍 Health Check

```bash
curl http://localhost:3000/api/health
```

## 📦 Estrutura de Pastas

```
src/
├── config/         # Configurações (database, env)
├── controllers/    # Controllers da API
├── middlewares/    # Middlewares (auth, error, logger)
├── models/        # Modelos de banco de dados
├── routes/        # Rotas da API
├── services/      # Lógica de negócio
├── types/         # Tipos e interfaces TypeScript
├── utils/         # Utilitários (password, jwt, uuid)
├── app.ts         # Configuração do Express
└── server.ts      # Inicialização do servidor
```

## 🔐 Segurança Implementada

- ✅ Senhas com hash bcrypt (10 rounds)
- ✅ JWT com expiração configurável
- ✅ Validação de entrada
- ✅ Helmet para headers de segurança
- ✅ CORS configurável
- ✅ SQL injection protection (prepared statements)
- ✅ Soft delete de usuários

## 🛠️ Scripts NPM

```bash
npm run dev      # Desenvolvimento com hot reload
npm run build    # Build para produção
npm start        # Executar build de produção
```

## ⚙️ Variáveis de Ambiente Importantes

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| DB_PASSWORD | Senha do PostgreSQL | postgres |
| JWT_SECRET | Chave secreta JWT | minha-chave-super-secreta |
| JWT_EXPIRES_IN | Expiração do token | 7d, 24h, 60m |
| PORT | Porta do servidor | 3000 |

## 🐛 Troubleshooting

### Erro de conexão com o banco

```bash
# Verifique se o PostgreSQL está rodando
psql -U postgres -c "SELECT 1"

# Verifique as credenciais no .env
cat .env
```

### Porta já em uso

```bash
# Mude a porta no .env
PORT=3001
```

### Token inválido

- Verifique se o JWT_SECRET no .env está correto
- Certifique-se de enviar o header: `Authorization: Bearer TOKEN`

## 📚 Próximos Passos

1. Testar todos os endpoints
2. Implementar refresh tokens
3. Adicionar rate limiting
4. Implementar recuperação de senha
5. Adicionar testes automatizados
6. Documentar com Swagger

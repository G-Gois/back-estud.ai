# Estud.AI - Plataforma de Estudo com IA

Sistema completo de estudo com geração automática de questionários usando GPT-4. Inclui autenticação JWT, banco de dados PostgreSQL e integração com OpenAI.

## Estrutura do Projeto

```
back-estud.ai/
├── src/
│   ├── config/           # Configurações (database, env)
│   ├── controllers/      # Controllers da API
│   ├── middlewares/      # Middlewares (auth, error handler, logger)
│   ├── models/          # Modelos de dados
│   ├── routes/          # Rotas da API
│   ├── services/        # Lógica de negócio
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários
│   ├── app.ts           # Configuração do Express
│   └── server.ts        # Inicialização do servidor
├── database/
│   └── database-start.sql  # Schema do banco de dados
├── .env                 # Variáveis de ambiente
├── .env.example         # Exemplo de variáveis de ambiente
├── tsconfig.json        # Configuração TypeScript
└── package.json         # Dependências do projeto
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
```bash
# Crie o banco de dados
createdb estud_ai

# Execute o schema
psql -d estud_ai -f database/database-start.sql
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DB_*`: Configurações do PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT (use uma string aleatória forte)
- `PORT`: Porta do servidor (padrão: 3000)

## Scripts Disponíveis

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## API Endpoints

### Autenticação

#### Registro de Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "nome_completo": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "data_nascimento": "2000-01-01"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

Resposta:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": "uuid",
      "nome_completo": "João Silva",
      "email": "joao@example.com",
      "data_nascimento": "2000-01-01",
      "criado_em": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### Obter Perfil (Autenticado)
```http
GET /api/auth/me
Authorization: Bearer {token}
```

#### Atualizar Perfil (Autenticado)
```http
PUT /api/auth/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome_completo": "João Silva Santos",
  "email": "novoemail@example.com"
}
```

#### Deletar Conta (Autenticado)
```http
DELETE /api/auth/me
Authorization: Bearer {token}
```

### Conteúdos (Geração com IA)

#### Criar Novo Conteúdo com Questionário
```http
POST /api/conteudos
Authorization: Bearer {token}
Content-Type: application/json

{
  "input": "Texto sobre o que você quer estudar"
}
```

Resposta:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Conteúdo e questionário criados com sucesso!",
  "data": {
    "conteudo_id": "uuid",
    "titulo": "Título gerado pela IA",
    "descricao": "Descrição gerada pela IA",
    "questionario_id": "uuid",
    "perguntas_criadas": 7
  }
}
```

#### Listar Conteúdos
```http
GET /api/conteudos
Authorization: Bearer {token}
```

#### Obter Conteúdo Específico
```http
GET /api/conteudos/{id}
Authorization: Bearer {token}
```

**Documentação Completa:** Veja [API_CONTEUDOS.md](./API_CONTEUDOS.md) para detalhes completos da API de conteúdos.

### Questionários

#### Buscar Questionário por ID
```http
GET /api/questionarios/{id}
Authorization: Bearer {token}
```

Retorna questionário completo com perguntas, opções e **respostas corretas** marcadas.

#### Buscar Questionário por ID do Conteúdo
```http
GET /api/questionarios/conteudo/{conteudoId}
Authorization: Bearer {token}
```

#### Listar Questionários
```http
GET /api/questionarios
Authorization: Bearer {token}
```

**Documentação Completa:** Veja [API_QUESTIONARIOS.md](./API_QUESTIONARIOS.md) para detalhes completos, exemplos de uso no frontend e estrutura das respostas.

### Health Check
```http
GET /api/health
```

## Recursos Implementados

### Segurança
- ✅ Senhas hasheadas com bcrypt
- ✅ Autenticação JWT
- ✅ Validação de entrada
- ✅ Helmet para headers de segurança
- ✅ CORS configurável
- ✅ Proteção contra SQL Injection (prepared statements)

### Funcionalidades de Autenticação
- ✅ Registro de usuário com validação
- ✅ Login com JWT
- ✅ Visualização de perfil
- ✅ Atualização de perfil
- ✅ Soft delete de conta
- ✅ UUIDv7 para IDs ordenados por tempo

### Funcionalidades de IA (Novo!)
- ✅ Geração automática de título e descrição usando GPT-4
- ✅ Criação automática de questionários com 7 perguntas
- ✅ 4 opções de múltipla escolha por pergunta
- ✅ Identificação automática da resposta correta
- ✅ Explicações educativas para cada pergunta
- ✅ Validação de qualidade dos questionários gerados
- ✅ Suporte para conteúdos de até 10.000 caracteres

### Arquitetura
- ✅ TypeScript com strict mode
- ✅ Separação de camadas (Controller → Service → Model)
- ✅ Error handling centralizado
- ✅ Request logging
- ✅ Graceful shutdown
- ✅ Pool de conexões do PostgreSQL

## Tecnologias Utilizadas

- **Runtime**: Node.js
- **Linguagem**: TypeScript
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (jsonwebtoken)
- **Hash de Senha**: bcrypt
- **Validação**: express-validator
- **Segurança**: helmet, cors
- **UUID**: uuidv7
- **IA**: OpenAI GPT-4 (gpt-4o-mini)

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| DB_HOST | Host do PostgreSQL | localhost |
| DB_PORT | Porta do PostgreSQL | 5432 |
| DB_USER | Usuário do PostgreSQL | postgres |
| DB_PASSWORD | Senha do PostgreSQL | - |
| DB_NAME | Nome do banco de dados | estud_ai |
| DB_POOL_SIZE | Tamanho do pool de conexões | 10 |
| JWT_SECRET | Chave secreta JWT | - |
| JWT_EXPIRES_IN | Tempo de expiração do token | 7d |
| **OPENAI_API_KEY** | **Chave da API OpenAI** | **-** |
| PORT | Porta do servidor | 3000 |
| NODE_ENV | Ambiente de execução | development |

**Importante:** Para usar a funcionalidade de geração de conteúdo, você precisa de uma chave da OpenAI. Obtenha em: https://platform.openai.com/api-keys

## 🚀 Deploy na Internet

Quer usar sua API na internet? É simples e grátis!

### Deploy Rápido (5 minutos)
📄 Veja: [DEPLOY_RAPIDO.md](./DEPLOY_RAPIDO.md)

**Opções gratuitas:**
- ✅ **Railway** (recomendado): https://railway.app
- ✅ **Render**: https://render.com

### Guia Completo
📚 Tutorial passo a passo: [DEPLOY.md](./DEPLOY.md)

**Inclui:**
- Configuração de banco de dados
- Variáveis de ambiente
- SSL automático
- Deploy automático no git push
- Troubleshooting

---

## Próximos Passos

### Autenticação
- [ ] Adicionar refresh tokens
- [ ] Implementar rate limiting
- [ ] Adicionar validação de email
- [ ] Implementar recuperação de senha
- [ ] Sistema de roles e permissões

### IA e Conteúdos
- [ ] Permitir escolher quantidade de perguntas (5, 7, 10)
- [ ] Permitir escolher nível de dificuldade
- [ ] Gerar resumos automáticos
- [ ] Suporte para upload de PDFs
- [ ] Modo de revisão espaçada
- [ ] Analytics de desempenho

### Geral
- [ ] Adicionar testes unitários e de integração
- [ ] Documentação com Swagger/OpenAPI
- [ ] Cache com Redis
- [ ] Sistema de filas para processamento assíncrono

## Licença

ISC

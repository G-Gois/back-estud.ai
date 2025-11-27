# API de Conteúdos - Geração com IA

Esta documentação descreve a nova funcionalidade de criação automática de conteúdos educacionais usando GPT-4.

## Visão Geral

A rota `/api/conteudos` permite que usuários autenticados criem conteúdos de estudo com questionários gerados automaticamente por IA.

### Fluxo de Criação

1. **Usuário envia o texto** do que quer estudar
2. **GPT gera título e descrição** do conteúdo
3. **Sistema salva o conteúdo** no banco de dados
4. **Sistema cria um questionário** (modo: null)
5. **GPT gera 7 perguntas** com 4 opções cada
6. **Sistema salva todas as perguntas** e opções no banco
7. **Retorna os dados** do conteúdo criado

---

## Endpoints

### 1. Criar Novo Conteúdo

Cria um novo conteúdo com questionário gerado automaticamente por IA.

**Endpoint:** `POST /api/conteudos`

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <seu_token_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "input": "Texto sobre o que você quer estudar (mínimo 50 caracteres, máximo 10.000)"
}
```

**Exemplo de Request:**
```bash
curl -X POST http://localhost:3000/api/conteudos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "input": "A fotossíntese é o processo pelo qual as plantas convertem luz solar em energia química. Durante a fotossíntese, as plantas absorvem dióxido de carbono (CO2) do ar e água (H2O) do solo. Usando a energia da luz solar capturada pela clorofila, elas produzem glicose (C6H12O6) e oxigênio (O2). Este processo ocorre principalmente nas folhas, especificamente nos cloroplastos. A fotossíntese é essencial para a vida na Terra, pois produz o oxigênio que respiramos e serve como base da cadeia alimentar."
  }'
```

**Resposta de Sucesso (201):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Conteúdo e questionário criados com sucesso!",
  "data": {
    "conteudo_id": "01234567-89ab-cdef-0123-456789abcdef",
    "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
    "descricao": "Estudo sobre como as plantas transformam luz solar em energia química, produzindo glicose e oxigênio essenciais para a vida.",
    "questionario_id": "abcdef01-2345-6789-abcd-ef0123456789",
    "perguntas_criadas": 7
  }
}
```

**Erros Possíveis:**

- **400 Bad Request** - Input inválido
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "O conteúdo deve ter pelo menos 50 caracteres para gerar um bom questionário",
  "path": "/api/conteudos",
  "method": "POST"
}
```

- **401 Unauthorized** - Token ausente ou inválido
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Token de autenticação não fornecido",
  "path": "/api/conteudos",
  "method": "POST"
}
```

- **500 Internal Server Error** - Erro ao processar com GPT
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Erro ao gerar questionário com GPT: ...",
  "path": "/api/conteudos",
  "method": "POST"
}
```

---

### 2. Listar Conteúdos do Usuário

Lista todos os conteúdos criados pelo usuário autenticado.

**Endpoint:** `GET /api/conteudos`

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <seu_token_jwt>
```

**Exemplo de Request:**
```bash
curl -X GET http://localhost:3000/api/conteudos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta de Sucesso (200):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Conteúdos recuperados com sucesso",
  "data": [
    {
      "id": "01234567-89ab-cdef-0123-456789abcdef",
      "input_bruto": "A fotossíntese é o processo...",
      "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
      "descricao": "Estudo sobre como as plantas transformam...",
      "criado_em": "2024-01-01T00:00:00.000Z",
      "criador_id": "user-uuid-here",
      "total_questionarios": 1,
      "total_perguntas": 7
    }
  ]
}
```

---

### 3. Obter Conteúdo Específico

Obtém um conteúdo específico com todas as perguntas e opções.

**Endpoint:** `GET /api/conteudos/:id`

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <seu_token_jwt>
```

**Exemplo de Request:**
```bash
curl -X GET http://localhost:3000/api/conteudos/01234567-89ab-cdef-0123-456789abcdef \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta de Sucesso (200):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Conteúdo recuperado com sucesso",
  "data": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "input_bruto": "A fotossíntese é o processo...",
    "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
    "descricao": "Estudo sobre como as plantas transformam...",
    "criado_em": "2024-01-01T00:00:00.000Z",
    "criador_id": "user-uuid-here",
    "questionarios": [
      {
        "id": "questionario-uuid",
        "conteudo_id": "01234567-89ab-cdef-0123-456789abcdef",
        "ordem": 1,
        "modo": null,
        "feedback_geral": null,
        "criado_em": "2024-01-01T00:00:00.000Z",
        "perguntas": [
          {
            "id": "pergunta-1-uuid",
            "questionario_id": "questionario-uuid",
            "ordem": 1,
            "enunciado": "Qual é o principal produto da fotossíntese?",
            "explicacao": "A glicose é o principal produto energético...",
            "opcao_correta_id": "opcao-2-uuid",
            "opcoes": [
              {
                "id": "opcao-1-uuid",
                "pergunta_id": "pergunta-1-uuid",
                "ordem": 1,
                "texto_opcao": "Oxigênio"
              },
              {
                "id": "opcao-2-uuid",
                "pergunta_id": "pergunta-1-uuid",
                "ordem": 2,
                "texto_opcao": "Glicose"
              },
              {
                "id": "opcao-3-uuid",
                "pergunta_id": "pergunta-1-uuid",
                "ordem": 3,
                "texto_opcao": "Água"
              },
              {
                "id": "opcao-4-uuid",
                "pergunta_id": "pergunta-1-uuid",
                "ordem": 4,
                "texto_opcao": "Dióxido de carbono"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

**Erros Possíveis:**

- **403 Forbidden** - Conteúdo pertence a outro usuário
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Você não tem permissão para acessar este conteúdo",
  "path": "/api/conteudos/01234567-89ab-cdef-0123-456789abcdef",
  "method": "GET"
}
```

- **404 Not Found** - Conteúdo não encontrado
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Conteúdo não encontrado",
  "path": "/api/conteudos/01234567-89ab-cdef-0123-456789abcdef",
  "method": "GET"
}
```

---

## Configuração Necessária

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-sua-chave-aqui
```

Para obter uma chave da OpenAI:
1. Acesse https://platform.openai.com/
2. Crie uma conta ou faça login
3. Vá em "API Keys"
4. Crie uma nova chave secreta
5. Copie e cole no `.env`

---

## Detalhes Técnicos

### Modelo de IA Utilizado

- **Título e Descrição:** `gpt-4o-mini`
- **Questionário:** `gpt-4o-mini`
- **Temperature:** 0.7 (título/descrição), 0.8 (questionário)

### Validações de Input

- **Mínimo:** 50 caracteres
- **Máximo:** 10.000 caracteres
- **Tipo:** String não vazia

### Estrutura do Questionário Gerado

- **Quantidade de Perguntas:** Exatamente 7
- **Opções por Pergunta:** Exatamente 4
- **Respostas Corretas:** Exatamente 1 por pergunta
- **Campos Gerados:**
  - Enunciado da pergunta
  - 4 opções de resposta
  - Explicação da resposta correta

### Prompts Utilizados

Os prompts foram cuidadosamente elaborados para:

1. **Título e Descrição:**
   - Criar títulos concisos e informativos
   - Gerar descrições claras e objetivas
   - Limitar tamanho (100 e 300 caracteres)

2. **Questionário:**
   - Cobrir diferentes aspectos do conteúdo
   - Variar níveis de dificuldade
   - Criar opções plausíveis mas distintas
   - Evitar ambiguidades
   - Incluir explicações educativas

---

## Logs e Monitoramento

Durante a criação, o sistema gera logs informativos:

```
[INFO] Iniciando criação de conteúdo: A fotossíntese é o processo...
[INFO] Gerando título e descrição com GPT...
[INFO] Título gerado: "Fotossíntese: O Processo de Conversão de Luz em Energia"
[INFO] Salvando conteúdo no banco...
[INFO] Criando questionário...
[INFO] Gerando questionário com GPT (7 perguntas)...
[INFO] Salvando perguntas e opções no banco...
[INFO] Pergunta 1/7 criada
[INFO] Opções da pergunta 1 criadas (correta: opção 2)
...
[INFO] Conteúdo criado com sucesso! 7 perguntas geradas.
```

---

## Exemplos de Uso

### Exemplo 1: Criar Conteúdo sobre Matemática

```bash
curl -X POST http://localhost:3000/api/conteudos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "O teorema de Pitágoras estabelece que em um triângulo retângulo, o quadrado da hipotenusa é igual à soma dos quadrados dos catetos. Matematicamente: a² + b² = c², onde c é a hipotenusa e a e b são os catetos. Este teorema é fundamental na geometria e tem aplicações práticas em construção, navegação e cálculos de distância."
  }'
```

### Exemplo 2: Criar Conteúdo sobre História

```bash
curl -X POST http://localhost:3000/api/conteudos \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "A Revolução Francesa foi um período de intensa mudança social e política na França entre 1789 e 1799. Começou com a Queda da Bastilha em 14 de julho de 1789 e culminou com o golpe de Napoleão Bonaparte. Os principais ideais eram liberdade, igualdade e fraternidade. Este evento transformou a estrutura política da Europa e inspirou movimentos democráticos em todo o mundo."
  }'
```

---

## Dicas de Uso

1. **Qualidade do Input:**
   - Forneça textos claros e bem estruturados
   - Inclua informações relevantes e factuais
   - Evite textos muito genéricos

2. **Tamanho Ideal:**
   - Textos entre 200-500 palavras geram melhores questionários
   - Muito curto: perguntas podem ser repetitivas
   - Muito longo: pode gerar timeout ou custo alto

3. **Performance:**
   - Criação leva ~10-30 segundos dependendo do tamanho
   - A API usa gpt-4o-mini para otimizar custo/qualidade

4. **Custos:**
   - Cada criação usa ~1.000-3.000 tokens
   - Monitore seu uso na OpenAI Platform

---

## Próximos Passos

Funcionalidades planejadas:

- [ ] Permitir escolher quantidade de perguntas (5, 7, 10)
- [ ] Permitir escolher nível de dificuldade
- [ ] Gerar resumos automáticos
- [ ] Suporte para upload de PDFs
- [ ] Modo de revisão espaçada
- [ ] Analytics de desempenho

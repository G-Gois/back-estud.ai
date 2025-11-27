# API de Questionários

Documentação completa das rotas para buscar e exibir questionários.

## Visão Geral

As rotas de questionários permitem que você:
1. Busque um questionário específico para montar a tela do quiz
2. Busque questionário a partir de um conteúdo
3. Liste todos os questionários do usuário

**Importante:** Todas as rotas retornam as **respostas corretas** marcadas para cada pergunta.

---

## Endpoints

### 1. Buscar Questionário por ID

Retorna um questionário completo com todas as perguntas, opções e respostas corretas.

**Endpoint:** `GET /api/questionarios/:id`

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <seu_token_jwt>
```

**Parâmetros de URL:**
- `id` - UUID do questionário

**Exemplo de Request:**
```bash
curl -X GET http://localhost:3000/api/questionarios/01234567-89ab-cdef-0123-456789abcdef \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta de Sucesso (200):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Questionário recuperado com sucesso",
  "data": {
    "questionario_id": "01234567-89ab-cdef-0123-456789abcdef",
    "conteudo_id": "abcdef01-2345-6789-abcd-ef0123456789",
    "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
    "descricao": "Estudo sobre como as plantas transformam luz solar...",
    "modo": null,
    "total_perguntas": 7,
    "perguntas": [
      {
        "id": "pergunta-1-uuid",
        "ordem": 1,
        "enunciado": "Qual é o principal produto da fotossíntese?",
        "explicacao": "A glicose é o principal produto energético produzido durante a fotossíntese...",
        "opcoes": [
          {
            "id": "opcao-1-uuid",
            "ordem": 1,
            "texto": "Oxigênio",
            "correta": false
          },
          {
            "id": "opcao-2-uuid",
            "ordem": 2,
            "texto": "Glicose",
            "correta": true
          },
          {
            "id": "opcao-3-uuid",
            "ordem": 3,
            "texto": "Água",
            "correta": false
          },
          {
            "id": "opcao-4-uuid",
            "ordem": 4,
            "texto": "Dióxido de carbono",
            "correta": false
          }
        ]
      },
      {
        "id": "pergunta-2-uuid",
        "ordem": 2,
        "enunciado": "Onde ocorre principalmente a fotossíntese nas plantas?",
        "explicacao": "A fotossíntese ocorre principalmente nas folhas...",
        "opcoes": [
          {
            "id": "opcao-5-uuid",
            "ordem": 1,
            "texto": "Raízes",
            "correta": false
          },
          {
            "id": "opcao-6-uuid",
            "ordem": 2,
            "texto": "Caule",
            "correta": false
          },
          {
            "id": "opcao-7-uuid",
            "ordem": 3,
            "texto": "Folhas (cloroplastos)",
            "correta": true
          },
          {
            "id": "opcao-8-uuid",
            "ordem": 4,
            "texto": "Flores",
            "correta": false
          }
        ]
      }
      // ... mais 5 perguntas
    ]
  }
}
```

**Estrutura da Resposta:**

- `questionario_id` - UUID do questionário
- `conteudo_id` - UUID do conteúdo relacionado
- `titulo` - Título do conteúdo
- `descricao` - Descrição do conteúdo (pode ser null)
- `modo` - Modo do questionário (null, "progressao" ou "reforco")
- `total_perguntas` - Quantidade total de perguntas
- `perguntas` - Array de perguntas ordenadas por `ordem`
  - `id` - UUID da pergunta
  - `ordem` - Número da ordem (1, 2, 3...)
  - `enunciado` - Texto da pergunta
  - `explicacao` - Explicação da resposta correta (pode ser null)
  - `opcoes` - Array de 4 opções
    - `id` - UUID da opção
    - `ordem` - Ordem da opção (1-4)
    - `texto` - Texto da opção
    - `correta` - **Boolean indicando se é a resposta correta**

**Erros Possíveis:**

- **401 Unauthorized** - Token inválido ou ausente
- **403 Forbidden** - Questionário pertence a outro usuário
- **404 Not Found** - Questionário não encontrado

---

### 2. Buscar Questionário por ID do Conteúdo

Retorna o primeiro questionário de um conteúdo específico.

**Endpoint:** `GET /api/questionarios/conteudo/:conteudoId`

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <seu_token_jwt>
```

**Parâmetros de URL:**
- `conteudoId` - UUID do conteúdo

**Exemplo de Request:**
```bash
curl -X GET http://localhost:3000/api/questionarios/conteudo/abcdef01-2345-6789-abcd-ef0123456789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta de Sucesso (200):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Questionário recuperado com sucesso",
  "data": {
    "questionario_id": "01234567-89ab-cdef-0123-456789abcdef",
    "conteudo_id": "abcdef01-2345-6789-abcd-ef0123456789",
    "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
    "descricao": "Estudo sobre...",
    "modo": null,
    "total_perguntas": 7,
    "perguntas": [...]
  }
}
```

A estrutura é idêntica ao endpoint anterior.

**Quando usar:**
- Quando você tem o ID do conteúdo e quer buscar seu questionário
- Ideal para fluxo: Criar Conteúdo → Buscar Questionário → Exibir Quiz

**Erros Possíveis:**

- **401 Unauthorized** - Token inválido ou ausente
- **403 Forbidden** - Conteúdo pertence a outro usuário
- **404 Not Found** - Conteúdo ou questionário não encontrado

---

### 3. Listar Questionários do Usuário

Lista todos os questionários criados pelo usuário autenticado (resumo).

**Endpoint:** `GET /api/questionarios`

**Autenticação:** Requerida (JWT Bearer Token)

**Headers:**
```
Authorization: Bearer <seu_token_jwt>
```

**Exemplo de Request:**
```bash
curl -X GET http://localhost:3000/api/questionarios \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta de Sucesso (200):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Questionários recuperados com sucesso",
  "data": [
    {
      "questionario_id": "01234567-89ab-cdef-0123-456789abcdef",
      "conteudo_id": "abcdef01-2345-6789-abcd-ef0123456789",
      "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
      "descricao": "Estudo sobre como as plantas...",
      "modo": null,
      "ordem": 1,
      "total_perguntas": 7,
      "criado_em": "2024-01-01T00:00:00.000Z"
    },
    {
      "questionario_id": "98765432-10fe-dcba-9876-543210fedcba",
      "conteudo_id": "fedcba98-7654-3210-fedc-ba9876543210",
      "titulo": "Teorema de Pitágoras",
      "descricao": "Estudo sobre o teorema...",
      "modo": null,
      "ordem": 1,
      "total_perguntas": 7,
      "criado_em": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Estrutura da Resposta:**

Array de objetos com:
- `questionario_id` - UUID do questionário
- `conteudo_id` - UUID do conteúdo
- `titulo` - Título do conteúdo
- `descricao` - Descrição do conteúdo
- `modo` - Modo do questionário
- `ordem` - Ordem do questionário no conteúdo
- `total_perguntas` - Quantidade de perguntas
- `criado_em` - Data de criação

**Ordenação:** Mais recentes primeiro

---

## Fluxo Completo de Uso

### Cenário 1: Criar e Iniciar Quiz

```bash
# 1. Fazer login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","senha":"senha123"}' | jq -r '.data.token')

# 2. Criar conteúdo
RESPONSE=$(curl -s -X POST http://localhost:3000/api/conteudos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input":"A fotossíntese é o processo..."}')

CONTEUDO_ID=$(echo $RESPONSE | jq -r '.data.conteudo_id')

# 3. Buscar questionário do conteúdo
curl -X GET http://localhost:3000/api/questionarios/conteudo/$CONTEUDO_ID \
  -H "Authorization: Bearer $TOKEN"

# Resultado: JSON completo com perguntas e respostas para montar o quiz
```

### Cenário 2: Listar e Escolher Quiz

```bash
# 1. Listar todos os questionários
curl -X GET http://localhost:3000/api/questionarios \
  -H "Authorization: Bearer $TOKEN"

# 2. Escolher um questionário_id da lista

# 3. Buscar detalhes completos
curl -X GET http://localhost:3000/api/questionarios/01234567-89ab-cdef-0123-456789abcdef \
  -H "Authorization: Bearer $TOKEN"
```

---

## Como Usar no Frontend

### React Example

```typescript
interface Opcao {
  id: string;
  ordem: number;
  texto: string;
  correta: boolean;
}

interface Pergunta {
  id: string;
  ordem: number;
  enunciado: string;
  explicacao: string | null;
  opcoes: Opcao[];
}

interface QuestionarioResponse {
  questionario_id: string;
  conteudo_id: string;
  titulo: string;
  descricao: string | null;
  modo: string | null;
  total_perguntas: number;
  perguntas: Pergunta[];
}

// Buscar questionário
const fetchQuestionario = async (questionarioId: string) => {
  const response = await fetch(
    `http://localhost:3000/api/questionarios/${questionarioId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data.data as QuestionarioResponse;
};

// Componente de Quiz
const QuizComponent = () => {
  const [questionario, setQuestionario] = useState<QuestionarioResponse | null>(null);
  const [respostasUsuario, setRespostasUsuario] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchQuestionario('questionario-id').then(setQuestionario);
  }, []);

  const verificarResposta = (perguntaId: string, opcaoId: string) => {
    const pergunta = questionario?.perguntas.find(p => p.id === perguntaId);
    const opcao = pergunta?.opcoes.find(o => o.id === opcaoId);
    return opcao?.correta || false;
  };

  return (
    <div>
      <h1>{questionario?.titulo}</h1>
      <p>{questionario?.descricao}</p>

      {questionario?.perguntas.map((pergunta, index) => (
        <div key={pergunta.id}>
          <h3>Pergunta {index + 1}: {pergunta.enunciado}</h3>

          {pergunta.opcoes.map((opcao) => (
            <label key={opcao.id}>
              <input
                type="radio"
                name={`pergunta-${pergunta.id}`}
                value={opcao.id}
                onChange={() => setRespostasUsuario(prev => ({
                  ...prev,
                  [pergunta.id]: opcao.id
                }))}
              />
              {opcao.texto}
            </label>
          ))}

          {/* Mostrar explicação após responder */}
          {respostasUsuario[pergunta.id] && (
            <div>
              <p>{verificarResposta(pergunta.id, respostasUsuario[pergunta.id])
                ? '✅ Correto!'
                : '❌ Incorreto'}</p>
              <p>{pergunta.explicacao}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## Validações e Permissões

### Permissões
- ✅ Usuário só acessa questionários de conteúdos que criou
- ✅ Autenticação obrigatória em todas as rotas
- ✅ Verificação de propriedade antes de retornar dados

### Validações
- ✅ Questionário deve existir
- ✅ Questionário deve ter perguntas
- ✅ Todas as perguntas têm 4 opções
- ✅ Cada pergunta tem exatamente 1 resposta correta

---

## Notas Importantes

1. **Respostas Corretas Incluídas:**
   - Todas as rotas retornam `correta: boolean` para cada opção
   - Útil para validação imediata no frontend
   - Permite mostrar feedback instantâneo

2. **Explicações:**
   - Campo `explicacao` pode ser `null`
   - Gerado automaticamente pelo GPT
   - Recomendado mostrar após o usuário responder

3. **Ordenação:**
   - Perguntas ordenadas por `ordem` (1, 2, 3...)
   - Opções ordenadas por `ordem` (1-4)
   - Garante apresentação consistente

4. **Performance:**
   - Queries otimizadas com joins
   - Cache recomendado no frontend
   - Dados já vêm estruturados para exibição

---

## Próximos Passos

Funcionalidades planejadas:

- [ ] Endpoint para submeter respostas e calcular pontuação
- [ ] Histórico de tentativas
- [ ] Modo de prática (sem salvar histórico)
- [ ] Modo de revisão (apenas erradas)
- [ ] Timer por questionário
- [ ] Ranking entre usuários

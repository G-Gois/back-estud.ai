# Exemplo: Fluxo Completo - Criar e Fazer Quiz

Este documento mostra um exemplo completo de uso da API, desde o login até fazer o questionário.

## 🎯 Objetivo

Criar um conteúdo sobre fotossíntese, gerar questionário automaticamente e buscar para exibir.

---

## Passo 1: Fazer Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "senha": "senha123"
  }'
```

**Resposta:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Login realizado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMTIzNDU2Ny04OWFiLWNkZWYtMDEyMy00NTY3ODlhYmNkZWYiLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDk4ODAwMDAsImV4cCI6MTcxMDQ4NDgwMH0.abcdef123456",
    "usuario": {
      "id": "01234567-89ab-cdef-0123-456789abcdef",
      "nome_completo": "João Silva",
      "email": "joao@example.com",
      "data_nascimento": "2000-01-01",
      "criado_em": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Salve o token:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Passo 2: Criar Conteúdo com Questionário

```bash
curl -X POST http://localhost:3000/api/conteudos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "A fotossíntese é o processo pelo qual as plantas convertem luz solar em energia química. Durante a fotossíntese, as plantas absorvem dióxido de carbono (CO2) do ar e água (H2O) do solo. Usando a energia da luz solar capturada pela clorofila, elas produzem glicose (C6H12O6) e oxigênio (O2). Este processo ocorre principalmente nas folhas, especificamente nos cloroplastos. A fotossíntese é essencial para a vida na Terra, pois produz o oxigênio que respiramos e serve como base da cadeia alimentar."
  }'
```

**Resposta:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Conteúdo e questionário criados com sucesso!",
  "data": {
    "conteudo_id": "abc123-def456-ghi789",
    "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
    "descricao": "Estudo sobre como as plantas transformam luz solar em energia química, produzindo glicose e oxigênio.",
    "questionario_id": "xyz987-uvw654-rst321",
    "perguntas_criadas": 7
  }
}
```

**Salve os IDs:**
```bash
CONTEUDO_ID="abc123-def456-ghi789"
QUESTIONARIO_ID="xyz987-uvw654-rst321"
```

---

## Passo 3: Buscar Questionário Para Fazer Quiz

### Opção A: Buscar por ID do Questionário

```bash
curl -X GET http://localhost:3000/api/questionarios/$QUESTIONARIO_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Opção B: Buscar por ID do Conteúdo

```bash
curl -X GET http://localhost:3000/api/questionarios/conteudo/$CONTEUDO_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta (ambas as opções retornam a mesma estrutura):**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Questionário recuperado com sucesso",
  "data": {
    "questionario_id": "xyz987-uvw654-rst321",
    "conteudo_id": "abc123-def456-ghi789",
    "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
    "descricao": "Estudo sobre como as plantas transformam luz solar em energia química, produzindo glicose e oxigênio.",
    "modo": null,
    "total_perguntas": 7,
    "perguntas": [
      {
        "id": "pergunta-1-id",
        "ordem": 1,
        "enunciado": "Qual é o principal produto energético da fotossíntese?",
        "explicacao": "A glicose é o principal produto da fotossíntese, sendo uma molécula de açúcar que armazena energia química.",
        "opcoes": [
          {
            "id": "opcao-1-id",
            "ordem": 1,
            "texto": "Oxigênio",
            "correta": false
          },
          {
            "id": "opcao-2-id",
            "ordem": 2,
            "texto": "Glicose",
            "correta": true
          },
          {
            "id": "opcao-3-id",
            "ordem": 3,
            "texto": "Água",
            "correta": false
          },
          {
            "id": "opcao-4-id",
            "ordem": 4,
            "texto": "Dióxido de carbono",
            "correta": false
          }
        ]
      },
      {
        "id": "pergunta-2-id",
        "ordem": 2,
        "enunciado": "Onde nas plantas ocorre principalmente a fotossíntese?",
        "explicacao": "A fotossíntese ocorre principalmente nos cloroplastos, organelas presentes nas células das folhas.",
        "opcoes": [
          {
            "id": "opcao-5-id",
            "ordem": 1,
            "texto": "Raízes",
            "correta": false
          },
          {
            "id": "opcao-6-id",
            "ordem": 2,
            "texto": "Caule",
            "correta": false
          },
          {
            "id": "opcao-7-id",
            "ordem": 3,
            "texto": "Cloroplastos nas folhas",
            "correta": true
          },
          {
            "id": "opcao-8-id",
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

---

## Passo 4: Exibir Quiz no Frontend

### Exemplo em JavaScript/React

```javascript
// 1. Buscar questionário
const response = await fetch(
  `http://localhost:3000/api/questionarios/${questionarioId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { data } = await response.json();

// 2. Exibir cada pergunta
data.perguntas.forEach((pergunta, index) => {
  console.log(`\nPergunta ${index + 1}: ${pergunta.enunciado}`);

  pergunta.opcoes.forEach((opcao) => {
    console.log(`  ${opcao.ordem}. ${opcao.texto}`);
  });
});

// 3. Validar resposta do usuário
const validarResposta = (perguntaId, opcaoEscolhidaId) => {
  const pergunta = data.perguntas.find(p => p.id === perguntaId);
  const opcao = pergunta.opcoes.find(o => o.id === opcaoEscolhidaId);

  if (opcao.correta) {
    console.log('✅ Correto!');
    console.log(`Explicação: ${pergunta.explicacao}`);
    return true;
  } else {
    console.log('❌ Incorreto');
    const opcaoCorreta = pergunta.opcoes.find(o => o.correta);
    console.log(`A resposta correta era: ${opcaoCorreta.texto}`);
    console.log(`Explicação: ${pergunta.explicacao}`);
    return false;
  }
};

// 4. Exemplo de uso
const respostaUsuario = 'opcao-2-id'; // Usuário escolheu "Glicose"
validarResposta('pergunta-1-id', respostaUsuario);
```

---

## Passo 5: Listar Todos os Questionários

Se você quiser ver todos os questionários disponíveis:

```bash
curl -X GET http://localhost:3000/api/questionarios \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Questionários recuperados com sucesso",
  "data": [
    {
      "questionario_id": "xyz987-uvw654-rst321",
      "conteudo_id": "abc123-def456-ghi789",
      "titulo": "Fotossíntese: O Processo de Conversão de Luz em Energia",
      "descricao": "Estudo sobre...",
      "modo": null,
      "ordem": 1,
      "total_perguntas": 7,
      "criado_em": "2024-01-01T00:00:00.000Z"
    }
    // ... mais questionários
  ]
}
```

---

## Script Bash Completo

```bash
#!/bin/bash

# Configuração
API_URL="http://localhost:3000"
EMAIL="joao@example.com"
SENHA="senha123"

# 1. Login
echo "1. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"senha\":\"$SENHA\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "Token obtido: ${TOKEN:0:20}..."

# 2. Criar conteúdo
echo -e "\n2. Criando conteúdo..."
CREATE_RESPONSE=$(curl -s -X POST $API_URL/api/conteudos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "A fotossíntese é o processo pelo qual as plantas convertem luz solar em energia química..."
  }')

CONTEUDO_ID=$(echo $CREATE_RESPONSE | jq -r '.data.conteudo_id')
QUESTIONARIO_ID=$(echo $CREATE_RESPONSE | jq -r '.data.questionario_id')
TITULO=$(echo $CREATE_RESPONSE | jq -r '.data.titulo')

echo "Conteúdo criado: $TITULO"
echo "Conteúdo ID: $CONTEUDO_ID"
echo "Questionário ID: $QUESTIONARIO_ID"

# 3. Buscar questionário
echo -e "\n3. Buscando questionário..."
QUIZ_RESPONSE=$(curl -s -X GET $API_URL/api/questionarios/$QUESTIONARIO_ID \
  -H "Authorization: Bearer $TOKEN")

echo $QUIZ_RESPONSE | jq '.data.perguntas[] | {ordem, enunciado}'

echo -e "\n✅ Fluxo completo executado com sucesso!"
```

---

## Resumo do Fluxo

1. **Login** → Obtém token JWT
2. **Criar Conteúdo** → GPT gera título, descrição e 7 perguntas
3. **Buscar Questionário** → Recebe perguntas com opções e respostas corretas
4. **Exibir Quiz** → Frontend monta a interface
5. **Validar Respostas** → Compara resposta do usuário com `correta: true`
6. **Mostrar Explicação** → Exibe o campo `explicacao` após responder

---

## Estrutura de Dados Importante

### Cada Pergunta Tem:
- `id` - UUID único
- `enunciado` - Texto da pergunta
- `explicacao` - Por que a resposta está correta
- `opcoes` - Array com 4 opções

### Cada Opção Tem:
- `id` - UUID único
- `texto` - Texto da opção
- `correta` - **Boolean indicando se é a resposta certa**

### Como Identificar a Correta:
```javascript
const opcaoCorreta = pergunta.opcoes.find(o => o.correta === true);
```

---

## Próximos Passos

Após montar o quiz, você pode:

1. **Implementar Timer** - Adicionar cronômetro por pergunta
2. **Calcular Pontuação** - Contar acertos/erros
3. **Salvar Histórico** - Guardar tentativas do usuário (futuro endpoint)
4. **Modo Prática** - Revisar perguntas erradas
5. **Compartilhar** - Gerar link para outros usuários

---

## Dicas

- **Cache:** Salve o questionário no localStorage/state para evitar buscas repetidas
- **UX:** Mostre explicação apenas após o usuário responder
- **Feedback:** Use cores (verde/vermelho) para indicar acerto/erro
- **Progresso:** Mostre "Pergunta X de 7"
- **Animações:** Adicione transições suaves entre perguntas

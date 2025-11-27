-- =========================
-- ENUMS
-- =========================

CREATE TYPE modo_questionario AS ENUM ('progressao', 'reforco');

-- =========================
-- TABELA: usuarios
-- =========================

CREATE TABLE usuarios (
    id               uuid PRIMARY KEY,      -- gerar UUIDv7 na aplicação
    nome_completo    text        NOT NULL,
    email            text        NOT NULL UNIQUE,
    senha_hash       text        NOT NULL,
    data_nascimento  date        NOT NULL,
    criado_em        timestamptz NOT NULL DEFAULT now(),
    excluido_em      timestamptz
);

-- =========================
-- TABELA: conteudos
-- =========================

CREATE TABLE conteudos (
    id          uuid PRIMARY KEY,
    input_bruto text        NOT NULL,      -- texto digitado pelo usuário
    titulo      text,
    descricao   text,
    criado_em   timestamptz NOT NULL DEFAULT now(),
    criador_id  uuid        NOT NULL REFERENCES usuarios(id)
);

CREATE INDEX idx_conteudos_criador_id ON conteudos (criador_id);

-- =========================
-- TABELA: questionarios
-- =========================

CREATE TABLE questionarios (
    id             uuid PRIMARY KEY,
    conteudo_id    uuid             NOT NULL REFERENCES conteudos(id),
    ordem          integer,
    modo           modo_questionario,      -- modo base do questionário (se fizer sentido guardar aqui)
    feedback_geral text,
    criado_em      timestamptz      NOT NULL DEFAULT now()
);

CREATE INDEX idx_questionarios_conteudo_id ON questionarios (conteudo_id);

-- =========================
-- TABELA: perguntas
-- =========================

CREATE TABLE perguntas (
    id              uuid PRIMARY KEY,
    questionario_id uuid        NOT NULL REFERENCES questionarios(id) ON DELETE CASCADE,
    ordem           integer     NOT NULL,
    enunciado       text        NOT NULL,
    explicacao      text
    -- opcao_correta_id será adicionada depois
);

CREATE INDEX idx_perguntas_questionario_id ON perguntas (questionario_id);

-- =========================
-- TABELA: opcoes
-- =========================

CREATE TABLE opcoes (
    id           uuid PRIMARY KEY,
    pergunta_id  uuid        NOT NULL REFERENCES perguntas(id) ON DELETE CASCADE,
    ordem        integer     NOT NULL,
    texto_opcao  text        NOT NULL
);

CREATE INDEX idx_opcoes_pergunta_id ON opcoes (pergunta_id);

-- Agora adicionamos a FK da opção correta na pergunta
ALTER TABLE perguntas
    ADD COLUMN opcao_correta_id uuid;

ALTER TABLE perguntas
    ADD CONSTRAINT fk_perguntas_opcao_correta
    FOREIGN KEY (opcao_correta_id)
    REFERENCES opcoes(id);

-- =========================
-- TABELA: resumos_questionario
-- (resumo gerado após cada questionário)
-- =========================

CREATE TABLE resumos_questionario (
    id              uuid PRIMARY KEY,
    questionario_id uuid        NOT NULL REFERENCES questionarios(id) ON DELETE CASCADE,
    resumo          text        NOT NULL,
    criado_em       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumos_questionario_id 
    ON resumos_questionario (questionario_id);

-- =========================
-- TABELA: historico_tentativas
-- (cada vez que o usuário faz um questionário)
-- =========================

CREATE TABLE historico_tentativas (
    id               uuid PRIMARY KEY,
    questionario_id  uuid             NOT NULL REFERENCES questionarios(id) ON DELETE CASCADE,
    user_id          uuid             NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    numero_tentativa integer          NOT NULL,
    modo             modo_questionario,
    iniciado_em      timestamptz      NOT NULL DEFAULT now(),
    finalizado_em    timestamptz,
    CONSTRAINT uq_tentativa_por_usuario UNIQUE (questionario_id, user_id, numero_tentativa)
);

CREATE INDEX idx_htentativas_questionario_id ON historico_tentativas (questionario_id);
CREATE INDEX idx_htentativas_user_id        ON historico_tentativas (user_id);

-- =========================
-- TABELA: historico_respostas
-- (respostas de cada pergunta em cada tentativa)
-- =========================

CREATE TABLE historico_respostas (
    id             uuid PRIMARY KEY,
    tentativa_id   uuid        NOT NULL REFERENCES historico_tentativas(id) ON DELETE CASCADE,
    pergunta_id    uuid        NOT NULL REFERENCES perguntas(id),
    opcao_id       uuid        NOT NULL REFERENCES opcoes(id),
    acertou        boolean     NOT NULL,
    respondido_em  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_resposta_por_tentativa UNIQUE (tentativa_id, pergunta_id)
);

CREATE INDEX idx_hrespostas_tentativa_id ON historico_respostas (tentativa_id);
CREATE INDEX idx_hrespostas_pergunta_id  ON historico_respostas (pergunta_id);

-- =========================
-- TABELA: historico_questionarios (opcional)
-- Você pode optar por NÃO usar, pois finalizado_em em historico_tentativas já cobre.
-- =========================

CREATE TABLE historico_questionarios (
    id              uuid PRIMARY KEY,
    questionario_id uuid        NOT NULL REFERENCES questionarios(id) ON DELETE CASCADE,
    finalizado      boolean      NOT NULL,
    atualizado_em   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_hquestionarios_questionario_id ON historico_questionarios (questionario_id);

-- =========================
-- TABELA: historico_conteudos
-- (log de exclusão de conteúdo)
-- =========================

CREATE TABLE historico_conteudos (
    id           uuid PRIMARY KEY,
    conteudo_id  uuid        NOT NULL REFERENCES conteudos(id),
    user_id      uuid        NOT NULL REFERENCES usuarios(id),
    excluido_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hconteudos_conteudo_id ON historico_conteudos (conteudo_id);
CREATE INDEX idx_hconteudos_user_id     ON historico_conteudos (user_id);

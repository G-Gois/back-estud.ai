// Enums
export enum ModoQuestionario {
  PROGRESSAO = 'progressao',
  REFORCO = 'reforco'
}

// User Types
export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  senha_hash: string;
  data_nascimento: Date;
  criado_em: Date;
  excluido_em?: Date | null;
}

export interface UsuarioCreateInput {
  nome_completo: string;
  email: string;
  senha: string;
  data_nascimento: Date;
}

export interface UsuarioResponse {
  id: string;
  nome_completo: string;
  email: string;
  data_nascimento: Date;
  criado_em: Date;
}

// Auth Types
export interface LoginInput {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioResponse;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Conteudo Types
export interface Conteudo {
  id: string;
  input_bruto: string;
  titulo?: string | null;
  descricao?: string | null;
  criado_em: Date;
  criador_id: string;
}

// Questionario Types
export interface Questionario {
  id: string;
  conteudo_id: string;
  ordem?: number | null;
  modo?: ModoQuestionario | null;
  feedback_geral?: string | null;
  criado_em: Date;
}

// Pergunta Types
export interface Pergunta {
  id: string;
  questionario_id: string;
  ordem: number;
  enunciado: string;
  explicacao?: string | null;
  opcao_correta_id?: string | null;
}

// Opcao Types
export interface Opcao {
  id: string;
  pergunta_id: string;
  ordem: number;
  texto_opcao: string;
}

// Resumo Questionario Types
export interface ResumoQuestionario {
  id: string;
  questionario_id: string;
  resumo: string;
  criado_em: Date;
}

// Historico Tentativas Types
export interface HistoricoTentativa {
  id: string;
  questionario_id: string;
  user_id: string;
  numero_tentativa: number;
  modo?: ModoQuestionario | null;
  iniciado_em: Date;
  finalizado_em?: Date | null;
}

// Historico Respostas Types
export interface HistoricoResposta {
  id: string;
  tentativa_id: string;
  pergunta_id: string;
  opcao_id: string;
  acertou: boolean;
  respondido_em: Date;
}

// Historico Questionarios Types
export interface HistoricoQuestionario {
  id: string;
  questionario_id: string;
  finalizado: boolean;
  atualizado_em: Date;
}

// Historico Conteudos Types
export interface HistoricoConteudo {
  id: string;
  conteudo_id: string;
  user_id: string;
  excluido_em: Date;
}

// Express Request with User
export interface AuthRequest extends Express.Request {
  user?: {
    userId: string;
    email: string;
  };
}

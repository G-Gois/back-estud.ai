import { Pool } from 'pg';
import {
  QuestionarioModel,
  PerguntaModel,
  OpcaoModel,
  ConteudoModel,
  HistoricoTentativaModel,
  HistoricoRespostaModel,
} from '../models';
import { AppError, NotFoundError } from '../utils';

// Tipos para resposta da API
interface OpcaoParaQuiz {
  id: string;
  ordem: number;
  texto: string;
  correta: boolean; // Indica se esta opção é a correta
}

interface PerguntaParaQuiz {
  id: string;
  ordem: number;
  enunciado: string;
  explicacao: string | null; // Explicação da resposta
  opcoes: OpcaoParaQuiz[];
}

interface QuestionarioParaQuiz {
  questionario_id: string;
  conteudo_id: string;
  titulo: string;
  descricao: string | null;
  modo: string | null;
  perguntas: PerguntaParaQuiz[];
  total_perguntas: number;
  finalizado: boolean;
  finalizado_em?: Date | null;
  numero_tentativa_finalizada?: number | null;
  historico_respostas?: RespostaHistoricoQuiz[] | null;
}

interface RespostaHistoricoQuiz {
  pergunta_id: string;
  enunciado: string;
  opcao_escolhida_id: string;
  opcao_escolhida_texto: string;
  acertou: boolean;
  respondido_em: Date;
  opcao_correta_id: string | null;
  opcao_correta_texto: string | null;
}

export class QuestionarioService {
  private questionarioModel: QuestionarioModel;
  private perguntaModel: PerguntaModel;
  private opcaoModel: OpcaoModel;
  private conteudoModel: ConteudoModel;
  private historicoTentativaModel: HistoricoTentativaModel;
  private historicoRespostaModel: HistoricoRespostaModel;

  constructor(pool: Pool) {
    this.questionarioModel = new QuestionarioModel(pool);
    this.perguntaModel = new PerguntaModel(pool);
    this.opcaoModel = new OpcaoModel(pool);
    this.conteudoModel = new ConteudoModel(pool);
    this.historicoTentativaModel = new HistoricoTentativaModel(pool);
    this.historicoRespostaModel = new HistoricoRespostaModel(pool);
  }

  /**
   * Busca questionário para fazer o quiz
   * Retorna as perguntas com opções e indica qual é a correta
   */
  async getQuestionarioParaQuiz(
    questionarioId: string,
    userId: string
  ): Promise<QuestionarioParaQuiz> {
    // Buscar questionário
    const questionario = await this.questionarioModel.findById(questionarioId);

    if (!questionario) {
      throw new NotFoundError('Questionário não encontrado');
    }

    // Buscar conteúdo para verificar permissão
    const conteudo = await this.conteudoModel.findById(questionario.conteudo_id);

    if (!conteudo) {
      throw new NotFoundError('Conteúdo não encontrado');
    }

    // Verificar se o usuário é o criador
    if (conteudo.criador_id !== userId) {
      throw new AppError('Você não tem permissão para acessar este questionário', 403);
    }

    // Buscar perguntas
    const perguntas = await this.perguntaModel.findByQuestionario(questionarioId);

    if (perguntas.length === 0) {
      throw new AppError('Este questionário não possui perguntas', 400);
    }

    // Buscar opções para cada pergunta
    const perguntasParaQuiz: PerguntaParaQuiz[] = await Promise.all(
      perguntas.map(async (pergunta) => {
        const opcoes = await this.opcaoModel.findByPergunta(pergunta.id);

        // Mapear opções indicando qual é a correta
        const opcoesParaQuiz: OpcaoParaQuiz[] = opcoes.map((opcao) => ({
          id: opcao.id,
          ordem: opcao.ordem,
          texto: opcao.texto_opcao,
          correta: opcao.id === pergunta.opcao_correta_id, // Marca se é a correta
        }));

        return {
          id: pergunta.id,
          ordem: pergunta.ordem,
          enunciado: pergunta.enunciado,
          explicacao: pergunta.explicacao || null,
          opcoes: opcoesParaQuiz,
        };
      })
    );

    // Ordenar perguntas pela ordem
    perguntasParaQuiz.sort((a, b) => a.ordem - b.ordem);

    // Buscar última tentativa finalizada e histórico de respostas
    const ultimaFinalizada =
      await this.historicoTentativaModel.findLastFinalizadaByQuestionarioUser(
        questionario.id,
        userId
      );

    let historicoRespostas: RespostaHistoricoQuiz[] | null = null;

    if (ultimaFinalizada) {
      const respostas = await this.historicoRespostaModel.findByTentativa(
        ultimaFinalizada.id
      );

      // Mapear para incluir textos das opções e enunciados
      historicoRespostas = respostas.map((r) => {
        const pergunta = perguntasParaQuiz.find((p) => p.id === r.pergunta_id);
        const opcaoEscolhida = pergunta?.opcoes.find((o) => o.id === r.opcao_id);
        const opcaoCorreta = pergunta?.opcoes.find((o) => o.correta);

        return {
          pergunta_id: r.pergunta_id,
          enunciado: pergunta?.enunciado || '',
          opcao_escolhida_id: r.opcao_id,
          opcao_escolhida_texto: opcaoEscolhida?.texto || '',
          acertou: r.acertou,
          respondido_em: r.respondido_em,
          opcao_correta_id: opcaoCorreta?.id || null,
          opcao_correta_texto: opcaoCorreta?.texto || null,
        };
      });
    }

    return {
      questionario_id: questionario.id,
      conteudo_id: conteudo.id,
      titulo: conteudo.titulo || 'Sem título',
      descricao: conteudo.descricao || null,
      modo: questionario.modo || null,
      perguntas: perguntasParaQuiz,
      total_perguntas: perguntasParaQuiz.length,
      finalizado: !!ultimaFinalizada,
      finalizado_em: ultimaFinalizada?.finalizado_em || null,
      numero_tentativa_finalizada: ultimaFinalizada?.numero_tentativa || null,
      historico_respostas: historicoRespostas,
    };
  }

  /**
   * Busca questionário por ID do conteúdo
   * Retorna o primeiro questionário encontrado
   */
  async getQuestionarioPorConteudo(
    conteudoId: string,
    userId: string
  ): Promise<QuestionarioParaQuiz> {
    // Verificar se conteúdo existe e pertence ao usuário
    const conteudo = await this.conteudoModel.findById(conteudoId);

    if (!conteudo) {
      throw new NotFoundError('Conteúdo não encontrado');
    }

    if (conteudo.criador_id !== userId) {
      throw new AppError('Você não tem permissão para acessar este conteúdo', 403);
    }

    // Buscar questionários do conteúdo
    const questionarios = await this.questionarioModel.findByConteudo(conteudoId);

    if (questionarios.length === 0) {
      throw new NotFoundError('Nenhum questionário encontrado para este conteúdo');
    }

    // Pegar o primeiro questionário (por padrão)
    const questionario = questionarios[0];

    // Reutilizar a função de buscar questionário
    return this.getQuestionarioParaQuiz(questionario.id, userId);
  }

  /**
   * Lista todos os questionários de um usuário
   */
  async listQuestionariosUsuario(userId: string) {
    // Buscar todos os conteúdos do usuário
    const conteudos = await this.conteudoModel.findByCreator(userId);

    const questionariosComInfo = [];

    for (const conteudo of conteudos) {
      // Buscar questionários de cada conteúdo
      const questionarios = await this.questionarioModel.findByConteudo(conteudo.id);

      for (const questionario of questionarios) {
        // Contar perguntas
        const perguntas = await this.perguntaModel.findByQuestionario(questionario.id);

        questionariosComInfo.push({
          questionario_id: questionario.id,
          conteudo_id: conteudo.id,
          titulo: conteudo.titulo,
          descricao: conteudo.descricao,
          modo: questionario.modo,
          ordem: questionario.ordem,
          total_perguntas: perguntas.length,
          criado_em: questionario.criado_em,
        });
      }
    }

    // Ordenar por data de criação (mais recente primeiro)
    questionariosComInfo.sort(
      (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
    );

    return questionariosComInfo;
  }
}

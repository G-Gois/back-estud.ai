import { Pool } from 'pg';
import {
  QuestionarioModel,
  PerguntaModel,
  OpcaoModel,
  ConteudoModel,
  HistoricoTentativaModel,
  HistoricoRespostaModel,
  ResumoQuestionarioModel,
} from '../models';
import { GPTService } from './GPTService';
import { generateUUID, AppError, NotFoundError, logger } from '../utils';

interface RespostaInput {
  pergunta_id: string;
  opcao_id: string;
}

interface FinalizarQuestionarioInput {
  questionario_id: string;
  respostas: RespostaInput[];
}

interface RespostaDetalhada {
  pergunta_id: string;
  enunciado: string;
  opcao_escolhida_id: string;
  opcao_escolhida_texto: string;
  opcao_correta_id: string;
  opcao_correta_texto: string;
  acertou: boolean;
  explicacao: string | null;
}

interface ResultadoFinalizacao {
  tentativa_id: string;
  questionario_id: string;
  total_perguntas: number;
  acertos: number;
  erros: number;
  porcentagem_acerto: number;
  respostas_detalhadas: RespostaDetalhada[];
  resumo: string;
  numero_tentativa: number;
}

export class FinalizacaoService {
  private questionarioModel: QuestionarioModel;
  private perguntaModel: PerguntaModel;
  private opcaoModel: OpcaoModel;
  private conteudoModel: ConteudoModel;
  private historicoTentativaModel: HistoricoTentativaModel;
  private historicoRespostaModel: HistoricoRespostaModel;
  private resumoQuestionarioModel: ResumoQuestionarioModel;
  private gptService: GPTService;

  constructor(pool: Pool) {
    this.questionarioModel = new QuestionarioModel(pool);
    this.perguntaModel = new PerguntaModel(pool);
    this.opcaoModel = new OpcaoModel(pool);
    this.conteudoModel = new ConteudoModel(pool);
    this.historicoTentativaModel = new HistoricoTentativaModel(pool);
    this.historicoRespostaModel = new HistoricoRespostaModel(pool);
    this.resumoQuestionarioModel = new ResumoQuestionarioModel(pool);
    this.gptService = new GPTService();
  }

  /**
   * Finaliza um questionário, salva respostas e gera resumo
   */
  async finalizarQuestionario(
    input: FinalizarQuestionarioInput,
    userId: string
  ): Promise<ResultadoFinalizacao> {
    try {
      logger.info(`Finalizando questionário ${input.questionario_id} para usuário ${userId}`);

      // 1. Buscar questionário e validar permissão
      const questionario = await this.questionarioModel.findById(input.questionario_id);
      if (!questionario) {
        throw new NotFoundError('Questionário não encontrado');
      }

      const conteudo = await this.conteudoModel.findById(questionario.conteudo_id);
      if (!conteudo) {
        throw new NotFoundError('Conteúdo não encontrado');
      }

      if (conteudo.criador_id !== userId) {
        throw new AppError('Você não tem permissão para acessar este questionário', 403);
      }

      // 2. Buscar todas as perguntas do questionário
      const perguntas = await this.perguntaModel.findByQuestionario(input.questionario_id);

      if (perguntas.length === 0) {
        throw new AppError('Este questionário não possui perguntas', 400);
      }

      // 3. Validar que todas as perguntas foram respondidas
      if (input.respostas.length !== perguntas.length) {
        throw new AppError(
          `Você deve responder todas as ${perguntas.length} perguntas`,
          400
        );
      }

      // 4. Contar número de tentativas anteriores
      const numeroTentativa =
        (await this.historicoTentativaModel.countTentativas(
          input.questionario_id,
          userId
        )) + 1;

      // 5. Criar nova tentativa
      const tentativaId = generateUUID();
      await this.historicoTentativaModel.create({
        id: tentativaId,
        questionario_id: input.questionario_id,
        user_id: userId,
        numero_tentativa: numeroTentativa,
        modo: questionario.modo,
      });

      logger.info(`Tentativa ${numeroTentativa} criada: ${tentativaId}`);

      // 6. Processar cada resposta
      const respostasDetalhadas: RespostaDetalhada[] = [];
      let acertos = 0;
      let erros = 0;

      for (const resposta of input.respostas) {
        // Buscar pergunta
        const pergunta = perguntas.find((p) => p.id === resposta.pergunta_id);
        if (!pergunta) {
          throw new AppError(`Pergunta ${resposta.pergunta_id} não encontrada`, 400);
        }

        // Buscar opção escolhida
        const opcaoEscolhida = await this.opcaoModel.findById(resposta.opcao_id);
        if (!opcaoEscolhida || opcaoEscolhida.pergunta_id !== resposta.pergunta_id) {
          throw new AppError('Opção inválida para esta pergunta', 400);
        }

        // Buscar opção correta
        const opcaoCorreta = await this.opcaoModel.findById(
          pergunta.opcao_correta_id || ''
        );
        if (!opcaoCorreta) {
          throw new AppError('Pergunta sem resposta correta definida', 500);
        }

        // Verificar se acertou
        const acertou = resposta.opcao_id === pergunta.opcao_correta_id;

        if (acertou) {
          acertos++;
        } else {
          erros++;
        }

        // Salvar resposta no histórico
        await this.historicoRespostaModel.create({
          id: generateUUID(),
          tentativa_id: tentativaId,
          pergunta_id: resposta.pergunta_id,
          opcao_id: resposta.opcao_id,
          acertou,
        });

        // Adicionar resposta detalhada
        respostasDetalhadas.push({
          pergunta_id: pergunta.id,
          enunciado: pergunta.enunciado,
          opcao_escolhida_id: opcaoEscolhida.id,
          opcao_escolhida_texto: opcaoEscolhida.texto_opcao,
          opcao_correta_id: opcaoCorreta.id,
          opcao_correta_texto: opcaoCorreta.texto_opcao,
          acertou,
          explicacao: pergunta.explicacao || null,
        });
      }

      // 7. Finalizar tentativa
      await this.historicoTentativaModel.finalizarTentativa(tentativaId);

      logger.info(`Respostas salvas: ${acertos} acertos, ${erros} erros`);

      // 8. Gerar resumo educativo com GPT
      logger.info('Gerando resumo educativo...');

      const perguntasErradas = respostasDetalhadas
        .filter((r) => !r.acertou)
        .map((r) => ({
          enunciado: r.enunciado,
          opcaoEscolhida: r.opcao_escolhida_texto,
          opcaoCorreta: r.opcao_correta_texto,
          explicacao: r.explicacao || 'Sem explicação disponível',
        }));

      const resumoTexto = await this.gptService.generateResumo(
        conteudo.titulo || 'este conteúdo',
        perguntasErradas
      );

      // 9. Salvar resumo no banco
      await this.resumoQuestionarioModel.create({
        id: generateUUID(),
        questionario_id: input.questionario_id,
        resumo: resumoTexto,
      });

      logger.info('Resumo gerado e salvo com sucesso');

      // 10. Calcular porcentagem
      const porcentagemAcerto = Math.round((acertos / perguntas.length) * 100);

      // 11. Retornar resultado
      return {
        tentativa_id: tentativaId,
        questionario_id: input.questionario_id,
        total_perguntas: perguntas.length,
        acertos,
        erros,
        porcentagem_acerto: porcentagemAcerto,
        respostas_detalhadas: respostasDetalhadas,
        resumo: resumoTexto,
        numero_tentativa: numeroTentativa,
      };
    } catch (error: any) {
      logger.error('Erro ao finalizar questionário:', error);
      throw new AppError(
        `Erro ao finalizar questionário: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  /**
   * Buscar resumo de um questionário
   */
  async getResumo(questionarioId: string, userId: string): Promise<string | null> {
    // Validar permissão
    const questionario = await this.questionarioModel.findById(questionarioId);
    if (!questionario) {
      throw new NotFoundError('Questionário não encontrado');
    }

    const conteudo = await this.conteudoModel.findById(questionario.conteudo_id);
    if (!conteudo) {
      throw new NotFoundError('Conteúdo não encontrado');
    }

    if (conteudo.criador_id !== userId) {
      throw new AppError('Você não tem permissão para acessar este questionário', 403);
    }

    // Buscar resumo mais recente
    const resumo = await this.resumoQuestionarioModel.findByQuestionario(questionarioId);

    return resumo ? resumo.resumo : null;
  }
}

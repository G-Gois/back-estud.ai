import { Pool } from 'pg';
import {
  ConteudoModel,
  QuestionarioModel,
  PerguntaModel,
  OpcaoModel,
  ResumoQuestionarioModel,
  HistoricoTentativaModel,
  HistoricoRespostaModel,
} from '../models';
import { GPTService } from './GPTService';
import { Conteudo, Questionario, ModoQuestionario } from '../types';
import { generateUUID, AppError, NotFoundError, logger } from '../utils';

interface CreateConteudoInput {
  input_bruto: string;
  criador_id: string;
}

interface ConteudoComQuestionario {
  conteudo: Conteudo;
  questionario: Questionario;
  perguntas_count: number;
}

export class ConteudoService {
  private conteudoModel: ConteudoModel;
  private questionarioModel: QuestionarioModel;
  private perguntaModel: PerguntaModel;
  private opcaoModel: OpcaoModel;
  private resumoQuestionarioModel: ResumoQuestionarioModel;
  private historicoTentativaModel: HistoricoTentativaModel;
  private historicoRespostaModel: HistoricoRespostaModel;
  private gptService: GPTService;

  constructor(pool: Pool) {
    this.conteudoModel = new ConteudoModel(pool);
    this.questionarioModel = new QuestionarioModel(pool);
    this.perguntaModel = new PerguntaModel(pool);
    this.opcaoModel = new OpcaoModel(pool);
    this.resumoQuestionarioModel = new ResumoQuestionarioModel(pool);
    this.historicoTentativaModel = new HistoricoTentativaModel(pool);
    this.historicoRespostaModel = new HistoricoRespostaModel(pool);
    this.gptService = new GPTService();
  }

  /**
   * Cria um novo conteúdo completo com questionário gerado por IA
   */
  async createConteudoComQuestionario(
    input: CreateConteudoInput
  ): Promise<ConteudoComQuestionario> {
    try {
      logger.info('Iniciando criação de conteúdo:', input.input_bruto.substring(0, 50) + '...');

      // 1. Gerar título e descrição usando GPT
      logger.info('Gerando título e descrição com GPT...');
      const { titulo, descricao } = await this.gptService.generateTituloDescricao(
        input.input_bruto
      );
      logger.info(`Título gerado: "${titulo}"`);

      // 2. Criar conteúdo no banco
      logger.info('Salvando conteúdo no banco...');
      const conteudoId = generateUUID();
      const conteudo = await this.conteudoModel.create({
        id: conteudoId,
        input_bruto: input.input_bruto,
        titulo,
        descricao,
        criador_id: input.criador_id,
      });

      // 3. Criar questionário com modo null
      logger.info('Criando questionário...');
      const questionarioId = generateUUID();
      const questionario = await this.questionarioModel.create({
        id: questionarioId,
        conteudo_id: conteudoId,
        ordem: 1,
        modo: null,
      });

      // 4. Gerar perguntas com GPT
      logger.info('Gerando questionário com GPT (7 perguntas)...');
      const questionarioGerado = await this.gptService.generateQuestionario(
        input.input_bruto,
        titulo,
        descricao
      );

      // 5. Salvar perguntas e opções no banco
      logger.info('Salvando perguntas e opções no banco...');
      let perguntasCount = 0;

      for (let i = 0; i < questionarioGerado.perguntas.length; i++) {
        const perguntaData = questionarioGerado.perguntas[i];
        const perguntaId = generateUUID();

        // Criar pergunta
        await this.perguntaModel.create({
          id: perguntaId,
          questionario_id: questionarioId,
          ordem: i + 1,
          enunciado: perguntaData.enunciado,
          explicacao: perguntaData.explicacao,
        });

        logger.info(`Pergunta ${i + 1}/7 criada`);

        // Criar opções
        let opcaoCorretaId: string | null = null;

        for (let j = 0; j < perguntaData.opcoes.length; j++) {
          const opcaoData = perguntaData.opcoes[j];
          const opcaoId = generateUUID();

          await this.opcaoModel.create({
            id: opcaoId,
            pergunta_id: perguntaId,
            ordem: j + 1,
            texto_opcao: opcaoData.texto,
          });

          // Guardar ID da opção correta
          if (opcaoData.correta) {
            opcaoCorretaId = opcaoId;
          }
        }

        // Atualizar pergunta com a opção correta
        if (opcaoCorretaId) {
          await this.perguntaModel.update(perguntaId, {
            opcao_correta_id: opcaoCorretaId,
          });
          logger.info(`Opções da pergunta ${i + 1} criadas (correta: opção ${perguntaData.opcoes.findIndex(o => o.correta) + 1})`);
        }

        perguntasCount++;
      }

      logger.info(`Conteúdo criado com sucesso! ${perguntasCount} perguntas geradas.`);

      return {
        conteudo,
        questionario,
        perguntas_count: perguntasCount,
      };
    } catch (error: any) {
      logger.error('Erro ao criar conteúdo:', error);
      throw new AppError(
        `Erro ao criar conteúdo: ${error.message}`,
        error.statusCode || 500
      );
    }
  }

  /**
   * Buscar conteúdo por ID com suas perguntas
   */
  async getConteudoComPerguntas(conteudoId: string, userId: string) {
    const conteudo = await this.conteudoModel.findById(conteudoId);

    if (!conteudo) {
      throw new AppError('Conteúdo não encontrado', 404);
    }

    // Verificar se o usuário é o criador
    if (conteudo.criador_id !== userId) {
      throw new AppError('Você não tem permissão para acessar este conteúdo', 403);
    }

    // Buscar questionários
    const questionarios = await this.questionarioModel.findByConteudo(conteudoId);

    // Buscar perguntas, opções e resumo para cada questionário
    const questionariosCompletos = await Promise.all(
      questionarios.map(async (q) => {
        const perguntas = await this.perguntaModel.findByQuestionario(q.id);

        const perguntasComOpcoes = await Promise.all(
          perguntas.map(async (p) => {
            const opcoes = await this.opcaoModel.findByPergunta(p.id);
            return {
              ...p,
              opcoes,
            };
          })
        );

        // Verificar se há tentativa finalizada pelo usuário
        const ultimaFinalizada =
          await this.historicoTentativaModel.findLastFinalizadaByQuestionarioUser(
            q.id,
            userId
          );

        // Buscar resumo do questionário (mais recente)
        const resumo = await this.resumoQuestionarioModel.findByQuestionario(q.id);

        return {
          ...q,
          perguntas: perguntasComOpcoes,
          resumo_questionario: resumo ? resumo.resumo : null,
          finalizado: !!ultimaFinalizada,
          finalizado_em: ultimaFinalizada?.finalizado_em || null,
          numero_tentativa_finalizada: ultimaFinalizada?.numero_tentativa || null,
        };
      })
    );

    return {
      ...conteudo,
      questionarios: questionariosCompletos,
    };
  }

  /**
   * Listar conteúdos do usuário
   */
  async listConteudosUsuario(userId: string) {
    const conteudos = await this.conteudoModel.findByCreator(userId);

    // Para cada conteúdo, contar quantas perguntas tem
    const conteudosComInfo = await Promise.all(
      conteudos.map(async (conteudo) => {
        const questionarios = await this.questionarioModel.findByConteudo(conteudo.id);
        let totalPerguntas = 0;

        for (const q of questionarios) {
          const perguntas = await this.perguntaModel.findByQuestionario(q.id);
          totalPerguntas += perguntas.length;
        }

        return {
          ...conteudo,
          total_questionarios: questionarios.length,
          total_perguntas: totalPerguntas,
        };
      })
    );

    return conteudosComInfo;
  }

  /**
   * Gerar novo questionário para conteúdo existente
   * - progressao=true: foca nos sub-conteúdos das questões que o usuário errou
   * - progressao=false: cria novas perguntas sobre o mesmo conteúdo sem repetir as anteriores
   */
  async gerarNovoQuestionario(
    conteudoId: string,
    userId: string,
    progressao: boolean
  ): Promise<ConteudoComQuestionario> {
    try {
      logger.info(
        `Gerando novo questionário (${progressao ? 'progressão focada nos erros' : 'reforço sem repetir'}) para conteúdo ${conteudoId}`
      );

      // 1. Buscar conteúdo e validar permissão
      const conteudo = await this.conteudoModel.findById(conteudoId);
      if (!conteudo) {
        throw new NotFoundError('Conteúdo não encontrado');
      }

      if (conteudo.criador_id !== userId) {
        throw new AppError('Você não tem permissão para acessar este conteúdo', 403);
      }

      // 2. Buscar questionários existentes
      const questionariosExistentes = await this.questionarioModel.findByConteudo(conteudoId);

      if (questionariosExistentes.length === 0) {
        throw new AppError('Este conteúdo não possui questionários anteriores', 400);
      }

      // 3. Calcular ordem do novo questionário
      const novaOrdem = Math.max(...questionariosExistentes.map((q) => q.ordem || 0)) + 1;

      let questionarioGerado;

      if (progressao) {
        // MODO PROGRESSÃO: focar nos sub-conteúdos das questões erradas
        logger.info('Modo PROGRESSÃO: buscando erros recentes para aprofundar...');

        // Buscar última tentativa do usuário em qualquer questionário deste conteúdo
        let ultimaTentativa = null;
        for (const q of questionariosExistentes) {
          const tentativas = await this.historicoTentativaModel.findByQuestionarioUser(
            q.id,
            userId
          );
          if (tentativas.length > 0) {
            // Pegar a mais recente
            const maisRecente = tentativas.sort(
              (a, b) =>
                new Date(b.iniciado_em).getTime() - new Date(a.iniciado_em).getTime()
            )[0];
            if (
              !ultimaTentativa ||
              new Date(maisRecente.iniciado_em).getTime() >
                new Date(ultimaTentativa.iniciado_em).getTime()
            ) {
              ultimaTentativa = maisRecente;
            }
          }
        }

        if (!ultimaTentativa) {
          throw new AppError(
            'Não há tentativas anteriores para gerar questionário de progressão baseado nos erros',
            400
          );
        }

        // Buscar respostas erradas da última tentativa
        const respostas = await this.historicoRespostaModel.findByTentativa(
          ultimaTentativa.id
        );
        const respostasErradas = respostas.filter((r) => !r.acertou);

        if (respostasErradas.length === 0) {
          throw new AppError(
            'Você acertou todas as perguntas! Não há lacunas para progressão.',
            400
          );
        }

        logger.info(`${respostasErradas.length} respostas erradas encontradas`);

        // Buscar detalhes das perguntas erradas
        const perguntasErradas: Array<{
          enunciado: string;
          opcaoCorreta: string;
          explicacao: string;
        }> = [];

        for (const resposta of respostasErradas) {
          const pergunta = await this.perguntaModel.findById(resposta.pergunta_id);
          if (!pergunta) continue;

          const opcaoCorreta = await this.opcaoModel.findById(
            pergunta.opcao_correta_id || ''
          );
          if (!opcaoCorreta) continue;

          perguntasErradas.push({
            enunciado: pergunta.enunciado,
            opcaoCorreta: opcaoCorreta.texto_opcao,
            explicacao: pergunta.explicacao || 'Sem explicação disponível',
          });
        }

        // Gerar novo questionário com GPT focado nos sub-conteúdos errados
        questionarioGerado = await this.gptService.generateQuestionarioReforco(
          conteudo.titulo || 'este conteúdo',
          conteudo.input_bruto,
          perguntasErradas
        );
      } else {
        // MODO REFORÇO: criar perguntas novas sobre o mesmo conteúdo sem repetir
        logger.info('Modo REFORÇO: buscando perguntas anteriores...');

        const perguntasAnteriores: Array<{ enunciado: string; opcoes: string[] }> = [];

        // Buscar todas as perguntas de todos os questionários anteriores
        for (const q of questionariosExistentes) {
          const perguntas = await this.perguntaModel.findByQuestionario(q.id);

          for (const p of perguntas) {
            const opcoes = await this.opcaoModel.findByPergunta(p.id);
            perguntasAnteriores.push({
              enunciado: p.enunciado,
              opcoes: opcoes.map((o) => o.texto_opcao),
            });
          }
        }

        logger.info(`${perguntasAnteriores.length} perguntas anteriores encontradas`);

        // Gerar novo questionário com GPT sem repetir perguntas
        questionarioGerado = await this.gptService.generateQuestionarioProgressao(
          conteudo.titulo || 'este conteúdo',
          conteudo.input_bruto,
          perguntasAnteriores
        );
      }

      // 4. Criar novo questionário no banco
      const questionarioId = generateUUID();
      const modo = progressao ? ModoQuestionario.PROGRESSAO : ModoQuestionario.REFORCO;

      logger.info(`Criando questionário com modo: ${modo}`);

      const questionario = await this.questionarioModel.create({
        id: questionarioId,
        conteudo_id: conteudoId,
        ordem: novaOrdem,
        modo,
      });

      // 5. Salvar perguntas e opções no banco
      logger.info('Salvando perguntas e opções no banco...');
      let perguntasCount = 0;

      for (let i = 0; i < questionarioGerado.perguntas.length; i++) {
        const perguntaData = questionarioGerado.perguntas[i];
        const perguntaId = generateUUID();

        // Criar pergunta
        await this.perguntaModel.create({
          id: perguntaId,
          questionario_id: questionarioId,
          ordem: i + 1,
          enunciado: perguntaData.enunciado,
          explicacao: perguntaData.explicacao,
        });

        logger.info(`Pergunta ${i + 1}/7 criada`);

        // Criar opções
        let opcaoCorretaId: string | null = null;

        for (let j = 0; j < perguntaData.opcoes.length; j++) {
          const opcaoData = perguntaData.opcoes[j];
          const opcaoId = generateUUID();

          await this.opcaoModel.create({
            id: opcaoId,
            pergunta_id: perguntaId,
            ordem: j + 1,
            texto_opcao: opcaoData.texto,
          });

          // Guardar ID da opção correta
          if (opcaoData.correta) {
            opcaoCorretaId = opcaoId;
          }
        }

        // Atualizar pergunta com a opção correta
        if (opcaoCorretaId) {
          await this.perguntaModel.update(perguntaId, {
            opcao_correta_id: opcaoCorretaId,
          });
          logger.info(
            `Opções da pergunta ${i + 1} criadas (correta: opção ${perguntaData.opcoes.findIndex((o) => o.correta) + 1})`
          );
        }

        perguntasCount++;
      }

      logger.info(
        `Novo questionário ${progressao ? 'de progressão (erros)' : 'de reforço (sem repetir)'} criado com sucesso! ${perguntasCount} perguntas geradas.`
      );

      return {
        conteudo,
        questionario,
        perguntas_count: perguntasCount,
      };
    } catch (error: any) {
      logger.error('Erro ao gerar novo questionário:', error);
      throw new AppError(
        `Erro ao gerar novo questionário: ${error.message}`,
        error.statusCode || 500
      );
    }
  }
}

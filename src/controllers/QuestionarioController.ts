import { Request, Response, NextFunction } from 'express';
import { QuestionarioService, FinalizacaoService } from '../services';
import { pool } from '../config';
import { formatResponse, ValidationError } from '../utils';

export class QuestionarioController {
  private questionarioService: QuestionarioService;
  private finalizacaoService: FinalizacaoService;

  constructor() {
    this.questionarioService = new QuestionarioService(pool);
    this.finalizacaoService = new FinalizacaoService(pool);
  }

  /**
   * Buscar questionário por ID para fazer o quiz
   * GET /api/questionarios/:id
   * Headers: Authorization: Bearer <token>
   *
   * Retorna o questionário completo com perguntas, opções e respostas corretas
   */
  getQuestionario = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;

      const result = await this.questionarioService.getQuestionarioParaQuiz(
        id,
        req.user.userId
      );

      res.status(200).json(
        formatResponse(result, 'Questionário recuperado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar questionário por ID do conteúdo
   * GET /api/questionarios/conteudo/:conteudoId
   * Headers: Authorization: Bearer <token>
   *
   * Retorna o primeiro questionário do conteúdo especificado
   */
  getQuestionarioPorConteudo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { conteudoId } = req.params;

      const result = await this.questionarioService.getQuestionarioPorConteudo(
        conteudoId,
        req.user.userId
      );

      res.status(200).json(
        formatResponse(result, 'Questionário recuperado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar todos os questionários do usuário
   * GET /api/questionarios
   * Headers: Authorization: Bearer <token>
   *
   * Retorna lista resumida de todos os questionários do usuário
   */
  listQuestionarios = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.questionarioService.listQuestionariosUsuario(
        req.user.userId
      );

      res.status(200).json(
        formatResponse(result, 'Questionários recuperados com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Finalizar questionário
   * POST /api/questionarios/:id/finalizar
   * Headers: Authorization: Bearer <token>
   * Body: { respostas: [{ pergunta_id, opcao_id }] }
   *
   * Salva respostas, gera resumo educativo e retorna resultado
   */
  finalizarQuestionario = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { respostas } = req.body;

      // Validação
      if (!respostas || !Array.isArray(respostas)) {
        throw new ValidationError('O campo "respostas" deve ser um array');
      }

      if (respostas.length === 0) {
        throw new ValidationError('Você deve fornecer pelo menos uma resposta');
      }

      // Validar formato de cada resposta
      for (const resposta of respostas) {
        if (!resposta.pergunta_id || !resposta.opcao_id) {
          throw new ValidationError(
            'Cada resposta deve ter "pergunta_id" e "opcao_id"'
          );
        }
      }

      const result = await this.finalizacaoService.finalizarQuestionario(
        {
          questionario_id: id,
          respostas,
        },
        req.user.userId
      );

      res.status(200).json(
        formatResponse(result, 'Questionário finalizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar resumo de um questionário
   * GET /api/questionarios/:id/resumo
   * Headers: Authorization: Bearer <token>
   *
   * Retorna o resumo educativo mais recente do questionário
   */
  getResumo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;

      const resumo = await this.finalizacaoService.getResumo(id, req.user.userId);

      if (!resumo) {
        res.status(200).json(
          formatResponse(
            { resumo: null },
            'Nenhum resumo encontrado. Complete o questionário primeiro.'
          )
        );
      } else {
        res.status(200).json(formatResponse({ resumo }, 'Resumo recuperado com sucesso'));
      }
    } catch (error) {
      next(error);
    }
  };
}

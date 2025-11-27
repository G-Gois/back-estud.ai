import { Request, Response, NextFunction } from 'express';
import { ConteudoService } from '../services';
import { pool } from '../config';
import { formatResponse, ValidationError } from '../utils';

export class ConteudoController {
  private conteudoService: ConteudoService;

  constructor() {
    this.conteudoService = new ConteudoService(pool);
  }

  /**
   * Criar novo conteúdo com questionário gerado por IA
   * POST /api/conteudos
   * Body: { input: string }
   * Headers: Authorization: Bearer <token>
   */
  createConteudo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { input } = req.body;

      // Validação
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        throw new ValidationError('O campo "input" é obrigatório e deve ser um texto válido');
      }

      if (input.length > 10000) {
        throw new ValidationError('O conteúdo não pode ter mais de 10.000 caracteres');
      }

      // Criar conteúdo
      const result = await this.conteudoService.createConteudoComQuestionario({
        input_bruto: input.trim(),
        criador_id: req.user.userId,
      });

      res.status(201).json(
        formatResponse(
          {
            conteudo_id: result.conteudo.id,
            titulo: result.conteudo.titulo,
            descricao: result.conteudo.descricao,
            questionario_id: result.questionario.id,
            perguntas_criadas: result.perguntas_count,
          },
          'Conteúdo e questionário criados com sucesso!'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gerar novo questionário para um conteúdo existente
   * POST /api/conteudos/:id/novo-questionario
   * Body: { progressao: boolean }
   * Headers: Authorization: Bearer <token>
   */
  gerarNovoQuestionario = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { progressao } = req.body;

      if (typeof progressao !== 'boolean') {
        throw new ValidationError(
          'O campo "progressao" é obrigatório e deve ser um booleano'
        );
      }

      const result = await this.conteudoService.gerarNovoQuestionario(
        id,
        req.user.userId,
        progressao
      );

      res.status(201).json(
        formatResponse(
          {
            conteudo_id: result.conteudo.id,
            questionario_id: result.questionario.id,
            modo: result.questionario.modo,
            ordem: result.questionario.ordem,
            progressao,
            perguntas_criadas: result.perguntas_count,
          },
          'Novo questionário gerado com sucesso!'
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter conteúdo por ID com perguntas
   * GET /api/conteudos/:id
   * Headers: Authorization: Bearer <token>
   */
  getConteudo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;

      const result = await this.conteudoService.getConteudoComPerguntas(
        id,
        req.user.userId
      );

      res.status(200).json(
        formatResponse(result, 'Conteúdo recuperado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar conteúdos do usuário
   * GET /api/conteudos
   * Headers: Authorization: Bearer <token>
   */
  listConteudos = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.conteudoService.listConteudosUsuario(req.user.userId);

      res.status(200).json(
        formatResponse(result, 'Conteúdos recuperados com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };
}

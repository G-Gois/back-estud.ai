import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { pool } from '../config';
import { UsuarioCreateInput, LoginInput } from '../types';
import { formatResponse } from '../utils';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(pool);
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input: UsuarioCreateInput = {
        nome_completo: req.body.nome_completo,
        email: req.body.email,
        senha: req.body.senha,
        data_nascimento: new Date(req.body.data_nascimento),
      };

      const result = await this.authService.register(input);

      res.status(201).json(
        formatResponse(result, 'Usuário registrado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input: LoginInput = {
        email: req.body.email,
        senha: req.body.senha,
      };

      const result = await this.authService.login(input);

      res.status(200).json(
        formatResponse(result, 'Login realizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const result = await this.authService.getProfile(req.user.userId);

      res.status(200).json(
        formatResponse(result, 'Perfil recuperado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   * PUT /api/auth/me
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const updates: Partial<UsuarioCreateInput> = {};

      if (req.body.nome_completo) updates.nome_completo = req.body.nome_completo;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.senha) updates.senha = req.body.senha;
      if (req.body.data_nascimento) updates.data_nascimento = new Date(req.body.data_nascimento);

      const result = await this.authService.updateProfile(req.user.userId, updates);

      res.status(200).json(
        formatResponse(result, 'Perfil atualizado com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete user account
   * DELETE /api/auth/me
   */
  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await this.authService.deleteAccount(req.user.userId);

      res.status(200).json(
        formatResponse(null, 'Conta excluída com sucesso')
      );
    } catch (error) {
      next(error);
    }
  };
}

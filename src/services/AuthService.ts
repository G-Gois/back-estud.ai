import { Pool } from 'pg';
import { UsuarioModel } from '../models';
import {
  UsuarioCreateInput,
  LoginInput,
  AuthResponse,
  UsuarioResponse,
} from '../types';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateUUID,
  ValidationError,
  UnauthorizedError,
  ConflictError,
} from '../utils';

export class AuthService {
  private usuarioModel: UsuarioModel;

  constructor(pool: Pool) {
    this.usuarioModel = new UsuarioModel(pool);
  }

  /**
   * Register a new user
   */
  async register(input: UsuarioCreateInput): Promise<AuthResponse> {
    // Validate input
    this.validateRegistrationInput(input);

    // Check if email already exists
    const emailExists = await this.usuarioModel.emailExists(input.email);
    if (emailExists) {
      throw new ConflictError('Email já está em uso');
    }

    // Hash password
    const senha_hash = await hashPassword(input.senha);

    // Generate UUID
    const id = generateUUID();

    // Create user with all required fields
    const createData = {
      id,
      nome_completo: input.nome_completo,
      email: input.email,
      senha: input.senha, // Include original senha field to satisfy type
      senha_hash,
      data_nascimento: input.data_nascimento,
    };

    // Create user
    const usuario = await this.usuarioModel.create(createData);

    // Generate token
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
    });

    // Return response
    return {
      token,
      usuario: UsuarioModel.toResponse(usuario),
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Validate input
    this.validateLoginInput(input);

    // Find user by email
    const usuario = await this.usuarioModel.findByEmail(input.email);
    if (!usuario) {
      throw new UnauthorizedError('Email ou senha inválidos');
    }

    // Compare password
    const isPasswordValid = await comparePassword(input.senha, usuario.senha_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email ou senha inválidos');
    }

    // Generate token
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
    });

    // Return response
    return {
      token,
      usuario: UsuarioModel.toResponse(usuario),
    };
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UsuarioResponse> {
    const usuario = await this.usuarioModel.findById(userId);
    if (!usuario) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    return UsuarioModel.toResponse(usuario);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<UsuarioCreateInput>
  ): Promise<UsuarioResponse> {
    // If updating password, hash it
    let updateData: any = { ...updates };
    if (updates.senha) {
      updateData.senha_hash = await hashPassword(updates.senha);
      delete updateData.senha;
    }

    // If updating email, check if it's already in use
    if (updates.email) {
      const emailExists = await this.usuarioModel.emailExists(updates.email, userId);
      if (emailExists) {
        throw new ConflictError('Email já está em uso');
      }
    }

    const usuario = await this.usuarioModel.update(userId, updateData);
    if (!usuario) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    return UsuarioModel.toResponse(usuario);
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string): Promise<void> {
    const deleted = await this.usuarioModel.softDelete(userId);
    if (!deleted) {
      throw new UnauthorizedError('Usuário não encontrado');
    }
  }

  /**
   * Validate registration input
   */
  private validateRegistrationInput(input: UsuarioCreateInput): void {
    if (!input.nome_completo || input.nome_completo.trim().length < 3) {
      throw new ValidationError('Nome completo deve ter pelo menos 3 caracteres');
    }

    if (!input.email || !this.isValidEmail(input.email)) {
      throw new ValidationError('Email inválido');
    }

    if (!input.senha || input.senha.length < 6) {
      throw new ValidationError('Senha deve ter pelo menos 6 caracteres');
    }

    if (!input.data_nascimento) {
      throw new ValidationError('Data de nascimento é obrigatória');
    }

    // Validate age (must be at least 13 years old)
    const birthDate = new Date(input.data_nascimento);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      throw new ValidationError('Você deve ter pelo menos 13 anos para se cadastrar');
    }
  }

  /**
   * Validate login input
   */
  private validateLoginInput(input: LoginInput): void {
    if (!input.email || !this.isValidEmail(input.email)) {
      throw new ValidationError('Email inválido');
    }

    if (!input.senha) {
      throw new ValidationError('Senha é obrigatória');
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

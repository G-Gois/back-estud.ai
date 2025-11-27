import { Pool, QueryResult } from 'pg';
import { Usuario, UsuarioCreateInput, UsuarioResponse } from '../types';

export class UsuarioModel {
  constructor(private pool: Pool) {}

  // Criar novo usuário
  async create(input: UsuarioCreateInput & { id: string; senha_hash: string }): Promise<Usuario> {
    const query = `
      INSERT INTO usuarios (id, nome_completo, email, senha_hash, data_nascimento)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      input.id,
      input.nome_completo,
      input.email,
      input.senha_hash,
      input.data_nascimento
    ];

    const result: QueryResult<Usuario> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar usuário por email
  async findByEmail(email: string): Promise<Usuario | null> {
    const query = `
      SELECT * FROM usuarios
      WHERE email = $1 AND excluido_em IS NULL
    `;

    const result: QueryResult<Usuario> = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  // Buscar usuário por ID
  async findById(id: string): Promise<Usuario | null> {
    const query = `
      SELECT * FROM usuarios
      WHERE id = $1 AND excluido_em IS NULL
    `;

    const result: QueryResult<Usuario> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Atualizar usuário
  async update(id: string, updates: Partial<Usuario>): Promise<Usuario | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'criado_em') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE usuarios
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND excluido_em IS NULL
      RETURNING *
    `;

    const result: QueryResult<Usuario> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Soft delete de usuário
  async softDelete(id: string): Promise<boolean> {
    const query = `
      UPDATE usuarios
      SET excluido_em = NOW()
      WHERE id = $1 AND excluido_em IS NULL
      RETURNING id
    `;

    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Verificar se email já existe
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    let query = `
      SELECT 1 FROM usuarios
      WHERE email = $1 AND excluido_em IS NULL
    `;
    const values: any[] = [email];

    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }

    const result = await this.pool.query(query, values);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Converter Usuario para UsuarioResponse (remove senha_hash)
  static toResponse(usuario: Usuario): UsuarioResponse {
    return {
      id: usuario.id,
      nome_completo: usuario.nome_completo,
      email: usuario.email,
      data_nascimento: usuario.data_nascimento,
      criado_em: usuario.criado_em
    };
  }
}

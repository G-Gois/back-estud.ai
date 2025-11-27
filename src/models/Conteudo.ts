import { Pool, QueryResult } from 'pg';
import { Conteudo } from '../types';

export class ConteudoModel {
  constructor(private pool: Pool) {}

  // Criar novo conteúdo
  async create(data: {
    id: string;
    input_bruto: string;
    titulo?: string;
    descricao?: string;
    criador_id: string;
  }): Promise<Conteudo> {
    const query = `
      INSERT INTO conteudos (id, input_bruto, titulo, descricao, criador_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.id,
      data.input_bruto,
      data.titulo || null,
      data.descricao || null,
      data.criador_id,
    ];

    const result: QueryResult<Conteudo> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar conteúdo por ID
  async findById(id: string): Promise<Conteudo | null> {
    const query = `SELECT * FROM conteudos WHERE id = $1`;
    const result: QueryResult<Conteudo> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar conteúdos por criador
  async findByCreator(criador_id: string): Promise<Conteudo[]> {
    const query = `
      SELECT * FROM conteudos
      WHERE criador_id = $1
      ORDER BY criado_em DESC
    `;
    const result: QueryResult<Conteudo> = await this.pool.query(query, [criador_id]);
    return result.rows;
  }

  // Atualizar conteúdo
  async update(id: string, updates: Partial<Conteudo>): Promise<Conteudo | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'criado_em' && key !== 'criador_id') {
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
      UPDATE conteudos
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult<Conteudo> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Deletar conteúdo
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM conteudos WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

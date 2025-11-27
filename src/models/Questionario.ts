import { Pool, QueryResult } from 'pg';
import { Questionario, ModoQuestionario } from '../types';

export class QuestionarioModel {
  constructor(private pool: Pool) {}

  // Criar novo questionário
  async create(data: {
    id: string;
    conteudo_id: string;
    ordem?: number;
    modo?: ModoQuestionario | null;
    feedback_geral?: string;
  }): Promise<Questionario> {
    const query = `
      INSERT INTO questionarios (id, conteudo_id, ordem, modo, feedback_geral)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.id,
      data.conteudo_id,
      data.ordem || null,
      data.modo || null,
      data.feedback_geral || null,
    ];

    const result: QueryResult<Questionario> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar questionário por ID
  async findById(id: string): Promise<Questionario | null> {
    const query = `SELECT * FROM questionarios WHERE id = $1`;
    const result: QueryResult<Questionario> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar questionários por conteúdo
  async findByConteudo(conteudo_id: string): Promise<Questionario[]> {
    const query = `
      SELECT * FROM questionarios
      WHERE conteudo_id = $1
      ORDER BY ordem ASC, criado_em ASC
    `;
    const result: QueryResult<Questionario> = await this.pool.query(query, [conteudo_id]);
    return result.rows;
  }

  // Atualizar questionário
  async update(id: string, updates: Partial<Questionario>): Promise<Questionario | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'criado_em' && key !== 'conteudo_id') {
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
      UPDATE questionarios
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult<Questionario> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Deletar questionário
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM questionarios WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

import { Pool, QueryResult } from 'pg';
import { Pergunta } from '../types';

export class PerguntaModel {
  constructor(private pool: Pool) {}

  // Criar nova pergunta
  async create(data: {
    id: string;
    questionario_id: string;
    ordem: number;
    enunciado: string;
    explicacao?: string;
  }): Promise<Pergunta> {
    const query = `
      INSERT INTO perguntas (id, questionario_id, ordem, enunciado, explicacao)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.id,
      data.questionario_id,
      data.ordem,
      data.enunciado,
      data.explicacao || null,
    ];

    const result: QueryResult<Pergunta> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar pergunta por ID
  async findById(id: string): Promise<Pergunta | null> {
    const query = `SELECT * FROM perguntas WHERE id = $1`;
    const result: QueryResult<Pergunta> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar perguntas por questionário
  async findByQuestionario(questionario_id: string): Promise<Pergunta[]> {
    const query = `
      SELECT * FROM perguntas
      WHERE questionario_id = $1
      ORDER BY ordem ASC
    `;
    const result: QueryResult<Pergunta> = await this.pool.query(query, [questionario_id]);
    return result.rows;
  }

  // Atualizar pergunta
  async update(id: string, updates: Partial<Pergunta>): Promise<Pergunta | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'questionario_id') {
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
      UPDATE perguntas
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult<Pergunta> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Deletar pergunta
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM perguntas WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

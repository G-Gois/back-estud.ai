import { Pool, QueryResult } from 'pg';
import { ResumoQuestionario } from '../types';

export class ResumoQuestionarioModel {
  constructor(private pool: Pool) {}

  // Criar novo resumo
  async create(data: {
    id: string;
    questionario_id: string;
    resumo: string;
  }): Promise<ResumoQuestionario> {
    const query = `
      INSERT INTO resumos_questionario (id, questionario_id, resumo)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const values = [data.id, data.questionario_id, data.resumo];

    const result: QueryResult<ResumoQuestionario> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar resumo por questionário (o mais recente)
  async findByQuestionario(questionario_id: string): Promise<ResumoQuestionario | null> {
    const query = `
      SELECT * FROM resumos_questionario
      WHERE questionario_id = $1
      ORDER BY criado_em DESC
      LIMIT 1
    `;
    const result: QueryResult<ResumoQuestionario> = await this.pool.query(query, [
      questionario_id,
    ]);
    return result.rows[0] || null;
  }

  // Buscar todos os resumos de um questionário
  async findAllByQuestionario(questionario_id: string): Promise<ResumoQuestionario[]> {
    const query = `
      SELECT * FROM resumos_questionario
      WHERE questionario_id = $1
      ORDER BY criado_em DESC
    `;
    const result: QueryResult<ResumoQuestionario> = await this.pool.query(query, [
      questionario_id,
    ]);
    return result.rows;
  }

  // Deletar resumo
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM resumos_questionario WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

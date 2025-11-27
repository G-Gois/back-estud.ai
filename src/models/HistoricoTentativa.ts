import { Pool, QueryResult } from 'pg';
import { HistoricoTentativa, ModoQuestionario } from '../types';

export class HistoricoTentativaModel {
  constructor(private pool: Pool) {}

  // Criar nova tentativa
  async create(data: {
    id: string;
    questionario_id: string;
    user_id: string;
    numero_tentativa: number;
    modo?: ModoQuestionario | null;
  }): Promise<HistoricoTentativa> {
    const query = `
      INSERT INTO historico_tentativas (id, questionario_id, user_id, numero_tentativa, modo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.id,
      data.questionario_id,
      data.user_id,
      data.numero_tentativa,
      data.modo || null,
    ];

    const result: QueryResult<HistoricoTentativa> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar tentativa por ID
  async findById(id: string): Promise<HistoricoTentativa | null> {
    const query = `SELECT * FROM historico_tentativas WHERE id = $1`;
    const result: QueryResult<HistoricoTentativa> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar tentativas por questionário e usuário
  async findByQuestionarioUser(
    questionario_id: string,
    user_id: string
  ): Promise<HistoricoTentativa[]> {
    const query = `
      SELECT * FROM historico_tentativas
      WHERE questionario_id = $1 AND user_id = $2
      ORDER BY numero_tentativa DESC
    `;
    const result: QueryResult<HistoricoTentativa> = await this.pool.query(query, [
      questionario_id,
      user_id,
    ]);
    return result.rows;
  }

  // Contar tentativas de um usuário em um questionário
  async countTentativas(questionario_id: string, user_id: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM historico_tentativas
      WHERE questionario_id = $1 AND user_id = $2
    `;
    const result = await this.pool.query(query, [questionario_id, user_id]);
    return parseInt(result.rows[0].count, 10);
  }

  // Buscar �ltima tentativa finalizada de um usu�rio em um question�rio
  async findLastFinalizadaByQuestionarioUser(
    questionario_id: string,
    user_id: string
  ): Promise<HistoricoTentativa | null> {
    const query = `
      SELECT * FROM historico_tentativas
      WHERE questionario_id = $1 AND user_id = $2 AND finalizado_em IS NOT NULL
      ORDER BY finalizado_em DESC
      LIMIT 1
    `;
    const result: QueryResult<HistoricoTentativa> = await this.pool.query(query, [
      questionario_id,
      user_id,
    ]);
    return result.rows[0] || null;
  }

  // Finalizar tentativa (marcar finalizado_em)
  async finalizarTentativa(id: string): Promise<HistoricoTentativa | null> {
    const query = `
      UPDATE historico_tentativas
      SET finalizado_em = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result: QueryResult<HistoricoTentativa> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

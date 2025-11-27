import { Pool, QueryResult } from 'pg';
import { HistoricoResposta } from '../types';

export class HistoricoRespostaModel {
  constructor(private pool: Pool) {}

  // Criar nova resposta
  async create(data: {
    id: string;
    tentativa_id: string;
    pergunta_id: string;
    opcao_id: string;
    acertou: boolean;
  }): Promise<HistoricoResposta> {
    const query = `
      INSERT INTO historico_respostas (id, tentativa_id, pergunta_id, opcao_id, acertou)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.id,
      data.tentativa_id,
      data.pergunta_id,
      data.opcao_id,
      data.acertou,
    ];

    const result: QueryResult<HistoricoResposta> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar respostas por tentativa
  async findByTentativa(tentativa_id: string): Promise<HistoricoResposta[]> {
    const query = `
      SELECT * FROM historico_respostas
      WHERE tentativa_id = $1
      ORDER BY respondido_em ASC
    `;
    const result: QueryResult<HistoricoResposta> = await this.pool.query(query, [
      tentativa_id,
    ]);
    return result.rows;
  }

  // Contar acertos em uma tentativa
  async countAcertos(tentativa_id: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM historico_respostas
      WHERE tentativa_id = $1 AND acertou = true
    `;
    const result = await this.pool.query(query, [tentativa_id]);
    return parseInt(result.rows[0].count, 10);
  }

  // Contar erros em uma tentativa
  async countErros(tentativa_id: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM historico_respostas
      WHERE tentativa_id = $1 AND acertou = false
    `;
    const result = await this.pool.query(query, [tentativa_id]);
    return parseInt(result.rows[0].count, 10);
  }
}

import { Pool, QueryResult } from 'pg';
import { Opcao } from '../types';

export class OpcaoModel {
  constructor(private pool: Pool) {}

  // Criar nova opção
  async create(data: {
    id: string;
    pergunta_id: string;
    ordem: number;
    texto_opcao: string;
  }): Promise<Opcao> {
    const query = `
      INSERT INTO opcoes (id, pergunta_id, ordem, texto_opcao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [data.id, data.pergunta_id, data.ordem, data.texto_opcao];

    const result: QueryResult<Opcao> = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar opção por ID
  async findById(id: string): Promise<Opcao | null> {
    const query = `SELECT * FROM opcoes WHERE id = $1`;
    const result: QueryResult<Opcao> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Buscar opções por pergunta
  async findByPergunta(pergunta_id: string): Promise<Opcao[]> {
    const query = `
      SELECT * FROM opcoes
      WHERE pergunta_id = $1
      ORDER BY ordem ASC
    `;
    const result: QueryResult<Opcao> = await this.pool.query(query, [pergunta_id]);
    return result.rows;
  }

  // Atualizar opção
  async update(id: string, updates: Partial<Opcao>): Promise<Opcao | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'pergunta_id') {
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
      UPDATE opcoes
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult<Opcao> = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  // Deletar opção
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM opcoes WHERE id = $1 RETURNING id`;
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

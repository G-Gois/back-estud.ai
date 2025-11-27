import OpenAI from 'openai';
import { env } from '../config';
import { AppError } from '../utils';

// Tipos para o GPT
interface TituloDescricao {
  titulo: string;
  descricao: string;
}

interface OpcaoGerada {
  texto: string;
  correta: boolean;
}

interface PerguntaGerada {
  enunciado: string;
  opcoes: OpcaoGerada[];
  explicacao: string;
}

interface QuestionarioGerado {
  perguntas: PerguntaGerada[];
}

export class GPTService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  /**
   * Gera título e descrição para um conteúdo
   */
  async generateTituloDescricao(inputBruto: string): Promise<TituloDescricao> {
    try {
      const prompt = `
Você é um assistente educacional especializado em criar títulos e descrições para conteúdos de estudo.

Com base no seguinte texto fornecido pelo usuário, crie:
1. Um título conciso e informativo (máximo 100 caracteres)
2. Uma descrição clara e objetiva do que será estudado (máximo 300 caracteres)

Texto do usuário:
"${inputBruto}"

Responda APENAS com um JSON no seguinte formato (sem formatação markdown):
{
  "titulo": "título aqui",
  "descricao": "descrição aqui"
}
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente educacional que responde sempre em JSON válido, sem formatação markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('GPT não retornou resposta');
      }

      // Remove markdown code blocks se existirem
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);
      return {
        titulo: parsed.titulo,
        descricao: parsed.descricao,
      };
    } catch (error: any) {
      console.error('Erro ao gerar título e descrição:', error);
      throw new AppError('Erro ao gerar título e descrição com GPT', 500);
    }
  }

  /**
   * Gera questionário com 7 perguntas de múltipla escolha
   */
  async generateQuestionario(
    inputBruto: string,
    titulo: string,
    descricao: string
  ): Promise<QuestionarioGerado> {
    try {
      const prompt = `
Você é um professor especialista em criar questionários educacionais de alta qualidade.

CONTEXTO:
Título: ${titulo}
Descrição: ${descricao}
Conteúdo completo: ${inputBruto}

TAREFA:
Crie um questionário com EXATAMENTE 7 perguntas de múltipla escolha sobre este conteúdo.

REGRAS IMPORTANTES:
1. Cada pergunta deve ter EXATAMENTE 4 opções
2. APENAS 1 opção deve ser a correta
3. As opções incorretas devem ser plausíveis, mas claramente distintas da correta
4. Perguntas devem cobrir diferentes aspectos do conteúdo
5. Inclua uma explicação breve (1-2 frases) do porquê a resposta está correta
6. Varie o nível de dificuldade (fácil, médio, difícil)
7. Evite perguntas ambíguas ou "pegadinhas"
8. Use linguagem clara e objetiva

FORMATO DE RESPOSTA:
Responda APENAS com um JSON válido (sem formatação markdown) no seguinte formato:

{
  "perguntas": [
    {
      "enunciado": "Texto da pergunta aqui?",
      "opcoes": [
        { "texto": "Opção A", "correta": false },
        { "texto": "Opção B", "correta": true },
        { "texto": "Opção C", "correta": false },
        { "texto": "Opção D", "correta": false }
      ],
      "explicacao": "Explicação de por que a opção B está correta."
    }
  ]
}

IMPORTANTE: Retorne EXATAMENTE 7 perguntas, cada uma com 4 opções.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um professor especialista que cria questionários educacionais. Sempre responda em JSON válido, sem formatação markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('GPT não retornou resposta');
      }

      // Remove markdown code blocks se existirem
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      // Validação
      if (!parsed.perguntas || !Array.isArray(parsed.perguntas)) {
        throw new Error('Formato inválido: perguntas não encontradas');
      }

      if (parsed.perguntas.length !== 7) {
        throw new Error(`Esperado 7 perguntas, recebido ${parsed.perguntas.length}`);
      }

      // Validar cada pergunta
      parsed.perguntas.forEach((pergunta: any, index: number) => {
        if (!pergunta.enunciado) {
          throw new Error(`Pergunta ${index + 1}: enunciado ausente`);
        }
        if (!pergunta.opcoes || !Array.isArray(pergunta.opcoes)) {
          throw new Error(`Pergunta ${index + 1}: opções inválidas`);
        }
        if (pergunta.opcoes.length !== 4) {
          throw new Error(
            `Pergunta ${index + 1}: esperado 4 opções, recebido ${pergunta.opcoes.length}`
          );
        }

        const corretas = pergunta.opcoes.filter((o: any) => o.correta === true);
        if (corretas.length !== 1) {
          throw new Error(
            `Pergunta ${index + 1}: deve ter exatamente 1 opção correta, tem ${corretas.length}`
          );
        }
      });

      return parsed;
    } catch (error: any) {
      console.error('Erro ao gerar questionário:', error);
      throw new AppError(
        `Erro ao gerar questionário com GPT: ${error.message}`,
        500
      );
    }
  }

  /**
   * Gera resumo educativo focando nos erros do questionário
   */
  async generateResumo(
    conteudoTitulo: string,
    perguntasErradas: Array<{
      enunciado: string;
      opcaoEscolhida: string;
      opcaoCorreta: string;
      explicacao: string;
    }>
  ): Promise<string> {
    try {
      // Se não houve erros, retorna mensagem de parabéns
      if (perguntasErradas.length === 0) {
        return 'Parabéns! Você acertou todas as questões! Continue assim e aprofunde seus estudos sobre este tema.';
      }

      const errosDetalhados = perguntasErradas
        .map(
          (p, index) => `
Erro ${index + 1}:
Pergunta: ${p.enunciado}
Sua resposta: ${p.opcaoEscolhida}
Resposta correta: ${p.opcaoCorreta}
Explicação: ${p.explicacao}
`
        )
        .join('\n');

      const prompt = `
Você é um professor especializado em criar resumos educativos personalizados.

CONTEXTO:
O aluno acabou de fazer um questionário sobre: "${conteudoTitulo}"
Ele errou ${perguntasErradas.length} pergunta(s) de 7.

ERROS COMETIDOS:
${errosDetalhados}

TAREFA:
Crie um resumo educativo (máximo 500 palavras) que:
1. Identifique os conceitos que o aluno precisa revisar
2. Explique de forma clara e didática os pontos onde houve erro
3. Dê dicas práticas de como memorizar ou entender melhor esses conceitos
4. Use uma linguagem encorajadora e motivadora
5. Sugira como o aluno pode melhorar no próximo questionário

FORMATO:
Escreva um texto corrido, bem estruturado em parágrafos.
NÃO use markdown, apenas texto puro.
Comece diretamente com o conteúdo, sem títulos ou saudações.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um professor paciente e didático que cria resumos educativos personalizados para ajudar alunos a melhorar.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const resumo = completion.choices[0]?.message?.content?.trim();

      if (!resumo) {
        throw new Error('GPT não retornou resumo');
      }

      return resumo;
    } catch (error: any) {
      console.error('Erro ao gerar resumo:', error);
      throw new AppError(`Erro ao gerar resumo com GPT: ${error.message}`, 500);
    }
  }

  /**
   * Gera questionário focando nos sub-conteúdos das questões erradas
   */
  async generateQuestionarioReforco(
    conteudoTitulo: string,
    inputBruto: string,
    perguntasErradas: Array<{
      enunciado: string;
      opcaoCorreta: string;
      explicacao: string;
    }>
  ): Promise<QuestionarioGerado> {
    try {
      const conceitosErrados = perguntasErradas
        .map(
          (p, index) => `
${index + 1}. Pergunta original: ${p.enunciado}
   Resposta correta: ${p.opcaoCorreta}
   Explicação: ${p.explicacao}
`
        )
        .join('\n');

      const prompt = `
Você é um professor especialista em criar questionários de progressão focados nas lacunas do aluno.

CONTEXTO:
Título do conteúdo: ${conteudoTitulo}
Conteúdo original: ${inputBruto}

O aluno errou as seguintes questões em tentativas anteriores (trate cada uma como um sub-conteúdo que precisa ser reforçado):
${conceitosErrados}

TAREFA:
Crie um questionário NOVO com EXATAMENTE 7 perguntas de múltipla escolha.

FOCO:
1. Aprofunde os sub-tópicos ligados aos enunciados e explicações das questões erradas
2. Não repita enunciados ou opções idênticas das perguntas anteriores
3. Use variações e níveis de detalhe que ajudem o aluno a progredir nesses sub-conteúdos
4. Mantenha o tom encorajador, mas com cobrança gradual

REGRAS:
1. Cada pergunta deve ter EXATAMENTE 4 opções
2. APENAS 1 opção deve ser a correta
3. As opções incorretas devem ser plausíveis
4. Inclua uma explicação breve (1-2 frases) do porquê a resposta está correta
5. Use linguagem clara e objetiva

FORMATO DE RESPOSTA:
Responda APENAS com um JSON válido (sem formatação markdown):

{
  "perguntas": [
    {
      "enunciado": "Texto da pergunta aqui?",
      "opcoes": [
        { "texto": "Opção A", "correta": false },
        { "texto": "Opção B", "correta": true },
        { "texto": "Opção C", "correta": false },
        { "texto": "Opção D", "correta": false }
      ],
      "explicacao": "Explicação de por que a opção B está correta."
    }
  ]
}

IMPORTANTE: Retorne EXATAMENTE 7 perguntas, cada uma com 4 opções.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um professor especialista que cria questionários de reforço personalizados. Sempre responda em JSON válido, sem formatação markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('GPT não retornou resposta');
      }

      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      // Validação (mesmo código do questionário original)
      if (!parsed.perguntas || !Array.isArray(parsed.perguntas)) {
        throw new Error('Formato inválido: perguntas não encontradas');
      }

      if (parsed.perguntas.length !== 7) {
        throw new Error(`Esperado 7 perguntas, recebido ${parsed.perguntas.length}`);
      }

      parsed.perguntas.forEach((pergunta: any, index: number) => {
        if (!pergunta.enunciado) {
          throw new Error(`Pergunta ${index + 1}: enunciado ausente`);
        }
        if (!pergunta.opcoes || !Array.isArray(pergunta.opcoes)) {
          throw new Error(`Pergunta ${index + 1}: opções inválidas`);
        }
        if (pergunta.opcoes.length !== 4) {
          throw new Error(
            `Pergunta ${index + 1}: esperado 4 opções, recebido ${pergunta.opcoes.length}`
          );
        }

        const corretas = pergunta.opcoes.filter((o: any) => o.correta === true);
        if (corretas.length !== 1) {
          throw new Error(
            `Pergunta ${index + 1}: deve ter exatamente 1 opção correta, tem ${corretas.length}`
          );
        }
      });

      return parsed;
    } catch (error: any) {
      console.error('Erro ao gerar questionário de reforço:', error);
      throw new AppError(
        `Erro ao gerar questionário de reforço com GPT: ${error.message}`,
        500
      );
    }
  }

  /**
   * Gera questionário de PROGRESSÃO sobre o mesmo conteúdo sem repetir
   */
  async generateQuestionarioProgressao(
    conteudoTitulo: string,
    inputBruto: string,
    perguntasAnteriores: Array<{
      enunciado: string;
      opcoes: string[];
    }>
  ): Promise<QuestionarioGerado> {
    try {
      const perguntasJaFeitas = perguntasAnteriores
        .map(
          (p, index) => `
${index + 1}. ${p.enunciado}
   Opções: ${p.opcoes.join(', ')}
`
        )
        .join('\n');

      const prompt = `
Você é um professor especialista em criar questionários de progressão educacional.

CONTEXTO:
Título do conteúdo: ${conteudoTitulo}
Conteúdo original: ${inputBruto}

O aluno já respondeu as seguintes perguntas anteriormente:
${perguntasJaFeitas}

TAREFA:
Crie um questionário de PROGRESSÃO com EXATAMENTE 7 perguntas de múltipla escolha.

IMPORTANTE - FOCO EM PROGRESSÃO:
1. NÃO REPITA nenhuma das perguntas que já foram feitas
2. NÃO use conceitos muito similares aos já perguntados
3. Explore NOVOS aspectos e NOVOS ângulos do mesmo conteúdo
4. Aprofunde em detalhes diferentes
5. Faça perguntas que complementem o conhecimento já testado
6. Mantenha um nível de dificuldade progressivo (pode ser um pouco mais desafiador)

REGRAS:
1. Cada pergunta deve ter EXATAMENTE 4 opções
2. APENAS 1 opção deve ser a correta
3. As opções incorretas devem ser plausíveis
4. Inclua uma explicação breve (1-2 frases) do porquê a resposta está correta
5. Use linguagem clara e objetiva

FORMATO DE RESPOSTA:
Responda APENAS com um JSON válido (sem formatação markdown):

{
  "perguntas": [
    {
      "enunciado": "Texto da pergunta aqui?",
      "opcoes": [
        { "texto": "Opção A", "correta": false },
        { "texto": "Opção B", "correta": true },
        { "texto": "Opção C", "correta": false },
        { "texto": "Opção D", "correta": false }
      ],
      "explicacao": "Explicação de por que a opção B está correta."
    }
  ]
}

IMPORTANTE: Retorne EXATAMENTE 7 perguntas, cada uma com 4 opções.
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um professor especialista que cria questionários de progressão. Sempre responda em JSON válido, sem formatação markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        throw new Error('GPT não retornou resposta');
      }

      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      // Validação
      if (!parsed.perguntas || !Array.isArray(parsed.perguntas)) {
        throw new Error('Formato inválido: perguntas não encontradas');
      }

      if (parsed.perguntas.length !== 7) {
        throw new Error(`Esperado 7 perguntas, recebido ${parsed.perguntas.length}`);
      }

      parsed.perguntas.forEach((pergunta: any, index: number) => {
        if (!pergunta.enunciado) {
          throw new Error(`Pergunta ${index + 1}: enunciado ausente`);
        }
        if (!pergunta.opcoes || !Array.isArray(pergunta.opcoes)) {
          throw new Error(`Pergunta ${index + 1}: opções inválidas`);
        }
        if (pergunta.opcoes.length !== 4) {
          throw new Error(
            `Pergunta ${index + 1}: esperado 4 opções, recebido ${pergunta.opcoes.length}`
          );
        }

        const corretas = pergunta.opcoes.filter((o: any) => o.correta === true);
        if (corretas.length !== 1) {
          throw new Error(
            `Pergunta ${index + 1}: deve ter exatamente 1 opção correta, tem ${corretas.length}`
          );
        }
      });

      return parsed;
    } catch (error: any) {
      console.error('Erro ao gerar questionário de progressão:', error);
      throw new AppError(
        `Erro ao gerar questionário de progressão com GPT: ${error.message}`,
        500
      );
    }
  }
}

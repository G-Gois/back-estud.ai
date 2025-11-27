import { Router } from 'express';
import { QuestionarioController } from '../controllers';
import { authenticate } from '../middlewares';

const router = Router();
const questionarioController = new QuestionarioController();

/**
 * Todas as rotas de questionário requerem autenticação
 */

// Listar todos os questionários do usuário
// GET /api/questionarios
// Headers: { Authorization: "Bearer <token>" }
router.get('/', authenticate, questionarioController.listQuestionarios);

// Buscar questionário por ID do conteúdo
// GET /api/questionarios/conteudo/:conteudoId
// Headers: { Authorization: "Bearer <token>" }
router.get(
  '/conteudo/:conteudoId',
  authenticate,
  questionarioController.getQuestionarioPorConteudo
);

// Buscar questionário específico por ID
// GET /api/questionarios/:id
// Headers: { Authorization: "Bearer <token>" }
// Retorna perguntas, opções e respostas corretas
router.get('/:id', authenticate, questionarioController.getQuestionario);

// Finalizar questionário
// POST /api/questionarios/:id/finalizar
// Headers: { Authorization: "Bearer <token>" }
// Body: { respostas: [{ pergunta_id: string, opcao_id: string }] }
router.post('/:id/finalizar', authenticate, questionarioController.finalizarQuestionario);

// Buscar resumo do questionário
// GET /api/questionarios/:id/resumo
// Headers: { Authorization: "Bearer <token>" }
router.get('/:id/resumo', authenticate, questionarioController.getResumo);

export default router;

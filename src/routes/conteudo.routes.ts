import { Router } from 'express';
import { ConteudoController } from '../controllers';
import { authenticate } from '../middlewares';

const router = Router();
const conteudoController = new ConteudoController();

/**
 * Todas as rotas de conteúdo requerem autenticação
 */

// Criar novo conteúdo com questionário gerado por IA
// POST /api/conteudos
// Headers: { Authorization: "Bearer <token>" }
// Body: { input: "texto do que o usuário quer estudar" }
router.post('/', authenticate, conteudoController.createConteudo);

// Gerar novo questionário para o mesmo conteúdo
// POST /api/conteudos/:id/novo-questionario
// Headers: { Authorization: "Bearer <token>" }
// Body: { progressao: true|false }
router.post('/:id/novo-questionario', authenticate, conteudoController.gerarNovoQuestionario);

// Listar todos os conteúdos do usuário
// GET /api/conteudos
// Headers: { Authorization: "Bearer <token>" }
router.get('/', authenticate, conteudoController.listConteudos);

// Obter conteúdo específico com perguntas
// GET /api/conteudos/:id
// Headers: { Authorization: "Bearer <token>" }
router.get('/:id', authenticate, conteudoController.getConteudo);

export default router;

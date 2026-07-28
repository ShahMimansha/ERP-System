import { Router } from 'express';
import { login, seed } from './auth.controller';
import validate from '../../utils/validate';
import { loginSchema } from './auth.schema';

const router = Router();

router.post('/login', validate(loginSchema, 'body'), login);
router.post('/seed', seed);

export default router;

import { Router } from "express";
import { register, login, forgotPassword, resetPassword, verifyEmail } from '../controllers/authController';
import { authenticateToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validateRequest";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from "../schemas/inventorySchema";

const router = Router();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);

router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);

router.get('/verify-email', validate({ body: verifyEmailSchema }), verifyEmail);

export default router;
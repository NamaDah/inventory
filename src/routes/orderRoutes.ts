import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { validate } from "../middleware/validateRequest";
import { createOrderSchema } from "../schemas/inventorySchema";
import { createOrder, getOrders } from "../controllers/orderController";


const router = Router();

router.post('/', authenticateToken, validate({ body: createOrderSchema }), createOrder);
router.get('/', authenticateToken, getOrders);

export default router;


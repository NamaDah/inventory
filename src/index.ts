import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { CustomError } from './utils/errors';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from './controllers/categoryController'; // Import specific controller functions
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from './controllers/productController'; // Import specific controller functions
import authRoutes from './routes/authRoutes'; // Auth routes will be modified separately
import { authenticateToken, authorizeRoles } from './middleware/authMiddleware';
import { validate } from './middleware/validateRequest'; // Import the Zod validation middleware
import { Role } from '@prisma/client';
import orderRoutes  from './routes/orderRoutes';

// Import all your Zod schemas for direct use in routes
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  idParamSchema,
  // registerSchema, 
  // loginSchema     
} from './schemas/inventorySchema';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Welcome to the Inventory API!');
});

// Authentication Routes (publicly accessible)
app.use('/api/auth', authRoutes); // This is fine as it handles register/login which are public

app.use('/api/orders', authenticateToken, orderRoutes);

// Category Routes
app.get('/api/categories', authenticateToken, getAllCategories); // Any authenticated user can GET all

app.get('/api/categories/:id', authenticateToken, getCategoryById); // Any authenticated user can GET by ID

app.post('/api/categories',
  authenticateToken, 
  authorizeRoles(Role.ADMIN), 
  validate({ body: createCategorySchema }), 
  createCategory);

app.put('/api/categories/:id',
  authenticateToken, 
  authorizeRoles(Role.ADMIN), 
  validate({ body: updateCategorySchema, params: idParamSchema }), 
  updateCategory);
  
app.delete('/api/categories/:id', authenticateToken, authorizeRoles(Role.ADMIN), deleteCategory); // Only ADMIN can DELETE

// Product Routes
app.get('/api/products', authenticateToken, getAllProducts); // Any authenticated user can GET all

app.get('/api/products/:id', authenticateToken, getProductById); // Any authenticated user can GET by ID

app.post('/api/products',
  authenticateToken,
  authorizeRoles(Role.ADMIN),
  validate({ body: createProductSchema }),
  createProduct); // Only ADMIN can POST

app.put('/api/products/:id', 
  authenticateToken, 
  authorizeRoles(Role.ADMIN),
  validate({ body: updateProductSchema, params: idParamSchema }) ,
  updateProduct); // Only ADMIN can PUT

app.delete('/api/products/:id', authenticateToken, authorizeRoles(Role.ADMIN), deleteProduct); // Only ADMIN can DELETE


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '2525', 10),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

transporter.verify((error, success) => {
  if(error) {
    console.error('Error verifying Mailtrap transporter: ', error);
  } else {
    console.log('Mailtrap transporter ready to send emails!');
  }
});


// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // Log the error stack for debugging

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      message: err.message,
      error: process.env.NODE_ENV === 'production' ? {} : err.stack,
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      error: err.errors.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      })),
    });
  }

  res.status(500).json({
    message: err.message || 'Internal Server Error: An unexpected error occurrred.',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
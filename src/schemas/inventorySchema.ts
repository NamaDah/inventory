import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['USER', 'ADMIN']).default('USER'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
})

export const createCategorySchema = z.object({
    name: z.string()
        .min(3, 'Category name must be at least 3 characters long')
        .max(150, 'Category name cannot exceed 150 characters')
});

export const updateCategorySchema = z.object({
    name: z.string()
        .min(3, 'Category name must be at least 3 characters long')
        .max(150, 'Category name cannot exceed 150 characters')
        .optional()
});

export const createProductSchema = z.object({
    name: z.string()
        .min(3, 'Product name must be at least 3 characters long')
        .max(150, 'Product name cannot exceed 150 characters'),
    description: z.string()
        .max(1000, 'Description cannot exceed 150 characters')
        .optional(),
    price: z.number()
        .positive('Price must be a positive number')
        .finite('Price must be a valid number (not NaN or Infinity)'),
    stock: z.number()
        .int('Stock must be an integer')
        .nonnegative('Stock must be a non-negative number'),
    categoryId: z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be a positive number'),
});

export const updateProductSchema = z.object({
    name: z.string()
        .min(3, 'Product name must be at least 3 characters long')
        .max(150, 'Product name cannot exceed 150 characters')
        .optional(),
    description: z.string()
        .max(1000, 'Description cannot exceed 150 characters')
        .optional(),
    price: z.number()
        .positive('Price must be a positive number')
        .finite('Price must be a valid number (not NaN or Infinity)')
        .optional(),
    stock: z.number()
        .int('Stock must be an integer')
        .nonnegative('Stock must be a non-negative number')
        .optional(),
    categoryId: z.number()
        .int('Category ID must be an integer')
        .positive('Category ID must be a positive number')
        .optional(),
});

export const createOrderItemInputSchema = z.object({
    productId: z.number()
    .int('Product ID must be an integer')
    .positive('Product ID must be a positive integer'),
    quantity: z.number()
    .int('Product ID must be an integer')
    .positive('Product ID must be a positive integer'),
})

export const createOrderSchema = z.object({
    items: z.array(createOrderItemInputSchema)
    .min(1, 'Order must contain at least one item.')
})

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email format'),
})

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long')
})

export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verifivation token is required!')
})

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number string').transform(Number),
})
import { NextFunction, Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../interfaces/auth";
// import { BadRequestError } from "../utils/errors" 

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, description, price, stock, categoryId } = req.body;

        const product = await prisma.product.create({
            data: {
                name,
                description, 
                price: parseFloat(price), // Ensure price is number for decimal type 
                stock: parseInt(stock), //Ensure stock is an integer 
                categoryId: parseInt(categoryId),
            },
        });
        res.status(201).json(product);
    } catch (error: any) {
        // P2003: Foreign key constraint failed  (e.g., categoryId does not exist)
        if (error.code === 'P2023') {
            return res.status(400).json({ message: 'Invalid categoryId provided.' });
        }
        res.status(500).json({ message: 'Error creating product.', error: error.message });
    }
};

export const getAllProducts = async (req: AuthRequest, res: Response) => {
    try {
        const product = await prisma.product.findMany({
            include: { category: true }, // Include category details
        });
        res.status(200).json(product);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching products.', error: error.message });
    }
};

export const getProductById = async (req: AuthRequest, res:Response) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: { category: true },
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as unknown as number;

        const { name, description, price, stock, categoryId } = req.body;

        const dataUpToDate: {
            name?: string
            description?: string
            price?: number
            stock?: number
            categoryId?: number
        } = {};

        if (name !== undefined) dataUpToDate.name = name;
        if (description !== undefined) dataUpToDate.description = description;
        if (price !== undefined) dataUpToDate.price = price;
        if (stock !== undefined) dataUpToDate.stock = stock;
        if (categoryId !== undefined) dataUpToDate.categoryId = categoryId;

        if (Object.keys(dataUpToDate).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update.' })
        }

        const product = await prisma.product.update({
            where: { id: id },
            data: dataUpToDate,
        });
        res.status(200).json( product);
    } catch (error: any) {
        if (error === 'P2025') { //Not Found
            return res.status(404).json({ message: 'Product not found for update.' });
        }
        if (error == 'P2003') {
            return res.status(400).json({ message: 'Invalid categoryId provided.' });
        }
        res.status(500).json({ message: 'Error updating data', error: error.message });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).send(); // No Content
    } catch (error: any) {
        if (error.code === 'P2025') { // Not Found
            return res.status(404).json({ message: 'Product not found for deletion.' });
        }
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
}
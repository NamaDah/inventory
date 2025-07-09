import { NextFunction, Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../interfaces/auth";
import { z } from "zod";

export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {   
        const { name } = req.body;
        const category = await prisma.category.create({
            data: { name },
        });
        res.status(201).json(category);
    } catch (error: any) {
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            return res.status(409).json({ message: 'Category with this name already exist' });
        }
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
};

export const getAllCategories = async (req: AuthRequest, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: { products: true }, // Also fetch related data
        });
        res.status(200).json(categories);
    }
    catch (error: any) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

export const getCategoryById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: { products: true },
        });
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json(category);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching category", error: error.message });
    }
};


export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as unknown as number;
        const { name } = req.body;

        const dataUpToDate: {
            name?: string
        } = {};

        if (name !== undefined) dataUpToDate.name = name;

        if (Object.keys(dataUpToDate).length === 0 ) {
            return res.status(400).json({ message: 'No validated fields provided for update.' })
        }

        const category = await prisma.category.update({
            where: { id: id },
            data: dataUpToDate,
        });
        res.status(200).json(category)
    } catch (error: any) {
        if (error.code === 'P2025') { // Not Found
            return res.status(404).json({ message: 'Category not found for update.' });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {   
            return res.status(409).json({ message: 'Category with this name already exists.' });
        }
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        // Check if category has associated product before deleting
        const categoryWithProduct = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: { products: true },
        });

        if (categoryWithProduct && categoryWithProduct.products.length > 0) {
            return res.status(400).json({ message: 'Cannot delete category with associated products. Please reassign or delete products first' });
        }

        await prisma.category.delete({
            where: { id: parseInt(id) },
        });
        res.status(204).send(); //No Content
    } catch (error: any) {
        if (error.code === 'P2025') { //Not Found
            return res.status(404).json({ message: 'Category not found for deletion' })
        }
        res.status(500).json({ message: 'Error deleting category.', error: error.message });
    }
};
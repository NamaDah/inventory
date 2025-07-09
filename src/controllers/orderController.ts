import { Response, NextFunction } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../interfaces/auth";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";
import { Prisma } from "@prisma/client";

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const { items } = req.body;

        if (!userId) {
            throw new UnauthorizedError('User not authenticated for order creation.');
        }

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            let totalOrderAmount = 0;
            const orderItemsToCreate: { productId: number, quantity: number, priceAtOrder: number }[] = [];

            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: { id: true, stock: true, price: true, name: true },
                });

                if (!product) {
                    throw new NotFoundError(`Product with ID ${item.productId} not found.`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestError(`Insufficient stock for product "${product.name}". Avaliable: ${product.stock}, Requested: ${item.quantity}.`);
                }

                totalOrderAmount += product.price.toNumber() * item.quantity;
                orderItemsToCreate.push({
                    productId: product.id,
                    quantity: item.quantity,
                    priceAtOrder: product.price.toNumber(),
                });
            }

            const newOrder = await tx.order.create({
                data: {
                    userId: userId,
                    totalAmount: totalOrderAmount,
                    status: 'PENDING',
                },
            });

            for (const itemData of orderItemsToCreate) {
                await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        productId: itemData.productId,
                        quantity: itemData.quantity,
                        priceAtOrder: itemData.priceAtOrder,
                    },
                });

                await tx.product.update({
                    where: { id: itemData.productId },
                    data: {
                        stock: {
                            decrement: itemData.quantity,
                        },
                    },
                });
            }
            return newOrder;
        });
        res.status(201).json({
            message: 'Order created successfully and stock reduced',
            order: result,
        });
    } catch (error: any) {
        // If any error occurs inside the transaction (e.g., insufficient stock),
        // it will be caught here and automatically roll back the transaction.
        next(error); // Pass the error to the global error handler
    }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        if(!userId){
            throw new UnauthorizedError('User not authenticated.');
        }

        let orders;
        if (userRole === 'ADMIN') {
            orders = await prisma.order.findMany({
                include: { user: { select: { id: true, email: true } }, orderItems: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            orders = await prisma.order.findMany({
                where: { userId: userId },
                include: { orderItems: { include: { product: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        res.status(200).json(orders);
    } catch (error: any) {
        next(error);
    }
};
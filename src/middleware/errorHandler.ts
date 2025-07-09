import { Request, Response, NextFunction } from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'An unexpected error occurred',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack,
    });
};

export default errorHandler;


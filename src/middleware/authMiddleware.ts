import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { AuthRequest, UserPayLoad } from "../interfaces/auth";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdefaultkey';


export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // check postman or whatever (chrome or something) Bearer TOKEN auth type, not JWT Bearer auth type

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const user = jwt.verify(token, JWT_SECRET) as UserPayLoad;
        req.user = user; // Attach user payload to the request
        next();
    } catch (error: any) {
        res.status(403).json({ message: 'Invalid token.', error: error.message });
    }
};

export const authorizeRoles = (...roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden. You do not have the required role.' });
        }
        next();
    };
};

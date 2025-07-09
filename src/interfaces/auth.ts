import { Request } from "express";
import { Role } from '@prisma/client';
import  { z } from "zod";

export interface UserPayLoad {
    userId: number
    email: String
    role: Role // Include Role in the token payload
}

export interface AuthRequest extends Request {
    user?: UserPayLoad
}
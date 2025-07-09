import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from "../prisma";
import { UserPayLoad } from "../interfaces/auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailServices";
import { BadRequestError, NotFoundError, UnauthorizedError, ConflictError } from "../utils/errors";
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdefaultkey';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, role } = req.body;


        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required.' });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ConflictError('User with this email already exists.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role === 'ADMIN' ? 'ADMIN' : 'USER',
                isVerified: false,
                verificationToken: verificationToken,
            },
            select: { id: true, email: true, role: true, isVerified: true }
        });

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            message: 'User registered successfully ',
            user: { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
        });
    } catch (error: any) {
        next(error);
    }
};


export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(409).json({ message: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT token
        const payload: UserPayLoad = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '168h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error: any) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {

        console.log('DEBUG (verifyEmail controller): req.query at start:', req.query);
        console.log('DEBUG (verifyEmail controller): req.query.token at start:', req.query.token);

        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            throw new BadRequestError('Token is not valid.');
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new UnauthorizedError('Token is not valid or already used.')
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });

        res.status(200).json({ message: 'Email successfully verified' })
    } catch (error: any) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' })
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await bcrypt.hash(resetToken, 10);

        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetTokenHash,
                resetPasswordExpires: resetExpires,
            },
        });
        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error: any) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new UnauthorizedError('Reset token has expired or not valid.');
        }
        const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken || '');
        if (!isTokenValid) {
            throw new UnauthorizedError('Reset token has expired or not valid.');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            }
        });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error: any) {
        next(error);
    }
}
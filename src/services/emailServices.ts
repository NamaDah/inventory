import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('DEBUG: EMAIL_HOST =', process.env.EMAIL_HOST);
console.log('DEBUG: EMAIL_PORT =', process.env.EMAIL_PORT);
console.log('DEBUG: EMAIL_USER =', process.env.EMAIL_USER);
console.log('DEBUG: EMAIL_PASS =', process.env.EMAIL_PASS ? '********' : 'UNDEFINED/EMPTY'); // Jangan tampilkan password aslinya

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("Nodemailer transporter verification failed:", error);
    } else {
        console.log("Nodemailer transporter is ready to send emails!", success)
    }
})

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Permintaan Reset Kata Sandi Anda',
        html: `
            <p>Halo,</p>
            <p>Anda menerima email ini karena Anda (atau orang lain) telah meminta reset kata sandi untuk akun Anda.</p>
            <p>Silakan klik tautan berikut, atau tempelkan ini ke browser Anda untuk menyelesaikan prosesnya:</p>
            <p><a href="${resetUrl}">Reset Kata Sandi</a></p>
            <p>Tautan ini akan kedaluwarsa dalam 1 jam.</p>
            <p>Jika Anda tidak meminta ini, silakan abaikan email ini dan kata sandi Anda akan tetap sama.</p>
            <p>Terima kasih,</p>
            <p>Tim Aplikasi Inventory Anda</p>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${to}`);
    } catch (mailError) {
        console.error(`Failed to send password reset email to ${to}:`, mailError);
        throw mailError;
    }
};

export const sendVerificationEmail = async (to: string, token: string) => {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Verifikasi Alamat Email Anda',
        html: `
            <p>Halo,</p>
            <p>Terima kasih telah mendaftar di Aplikasi Inventory kami!</p>
            <p>Silakan verifikasi alamat email Anda dengan mengklik tautan berikut:</p>
            <p><a href="${verifyUrl}">Verifikasi Email Saya</a></p>
            <p>Tautan ini akan kedaluwarsa dalam 24 jam.</p>
            <p>Jika Anda tidak mendaftar untuk layanan ini, silakan abaikan email ini.</p>
            <p>Terima kasih,</p>
            <p>Tim Aplikasi Inventory Anda</p>
        `,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${to}`);
    } catch (mailError) {
        console.error(`Failed to send verification email to ${to}`);
        throw mailError;
    }
    
};
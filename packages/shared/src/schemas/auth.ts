import { z } from 'zod';
import { isValidRut, cleanRut } from '../rut.js';

const passwordSchema = z
  .string()
  .min(10, 'Mínimo 10 caracteres')
  .max(72, 'Máximo 72 caracteres') // bcrypt limit
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número');

export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Nombre demasiado corto').max(120),
  rut: z
    .string()
    .trim()
    .transform(cleanRut)
    .refine(isValidRut, 'RUT inválido')
    .optional(),
  phone: z.string().trim().max(20).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

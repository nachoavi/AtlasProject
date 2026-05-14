import { z } from 'zod';
import { cleanRut, isValidRut } from '../rut.js';

export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CARD_EXTERNAL', 'OTHER'] as const;
export type PaymentMethodCode = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodCode, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD_EXTERNAL: 'Tarjeta (POS)',
  OTHER: 'Otro',
};

const PaymentMethodSchema = z.enum(PAYMENT_METHODS);

export const StaffCreateMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  fullName: z.string().trim().min(2).max(120),
  rut: z
    .string()
    .trim()
    .transform(cleanRut)
    .refine(isValidRut, 'RUT inválido')
    .optional(),
  phone: z.string().trim().max(20).optional(),
});
export type StaffCreateMemberInput = z.infer<typeof StaffCreateMemberSchema>;

export const StaffCreateSubscriptionSchema = z.object({
  userId: z.string().cuid('Usuario inválido'),
  planCode: z.string().min(1, 'Plan requerido'),
  paymentMethod: PaymentMethodSchema,
  amountClp: z.coerce.number().int().nonnegative().optional(), // override del precio si se aplica descuento manual
  startsAt: z.coerce.date().optional(),
  autoRenew: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});
export type StaffCreateSubscriptionInput = z.infer<typeof StaffCreateSubscriptionSchema>;

export const StaffCreateSessionPackSchema = z.object({
  userId: z.string().cuid('Usuario inválido'),
  packCode: z.string().min(1, 'Pack requerido'),
  paymentMethod: PaymentMethodSchema,
  amountClp: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});
export type StaffCreateSessionPackInput = z.infer<typeof StaffCreateSessionPackSchema>;

export const StaffSearchSchema = z.object({
  q: z.string().min(1, 'Búsqueda vacía'),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});
export type StaffSearchInput = z.infer<typeof StaffSearchSchema>;

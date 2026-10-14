import { z } from 'zod';

export const createPatientSchema = z.object({
    fullName: z
        .string()
        .min(1, 'El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre es demasiado largo'),

    email: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
            { message: 'Email inválido' }
        ),

    phoneNumber: z.string().optional(),

    birthDate: z
        .string()
        .min(1, 'La fecha de nacimiento es requerida')
        .refine(
            (val) => {
                const date = new Date(val);
                if (isNaN(date.getTime())) return false;
                return date <= new Date();
            },
            { message: 'Fecha de nacimiento inválida' }
        ),

    address: z.string().optional(),
    photoUrl: z.string().optional(),
    dentalHistory: z.string().optional(),
    habits: z.string().optional(),
    medicalConditions: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
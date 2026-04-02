import { z } from 'zod';

// Esquema para crear pacientes
export const createPatientSchema = z.object({
    fullName: z.string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder los 100 caracteres'),
    phoneNumber: z.string()
        .min(7, 'Teléfono inválido')
        .max(11, 'Teléfono inválido')
        .regex(/^[+]?[\d\s-]+$/, 'Formato de teléfono inválido'),
    email: z.string()
        .email('Email inválido')
        .max(100, 'Email no puede exceder 100 caracteres'),
    birthDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
        .refine((date) => {
            const birthDate = new Date(date);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age >= 0 && age <= 120;
        }, 'Fecha de nacimiento inválida'),
    address: z.string().max(200, 'Dirección no puede exceder 200 caracteres').optional(),
    dentalHistory: z.string().max(500, 'Historial no puede exceder 500 caracteres').optional(),
    habits: z.string().max(200, 'Hábitos no pueden exceder 200 caracteres').optional(),
    medicalConditions: z.string().max(500, 'Condiciones médicas no pueden exceder 500 caracteres').optional(),
});

//Esquema para actulizar paciente

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
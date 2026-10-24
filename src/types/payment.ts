import { Treatment } from "./clinicalHistory";

export type PaymentMethodType = 'CASH' | 'TRANSFER';
export type PaymentStatusType = 'ACTIVE' | 'VOIDED';

export interface Payment {
    id: number;
    treatmentId: number;
    clinicId: number;
    amount: number | string;
    paymentDate: string;
    paymentMethod: PaymentMethodType;
    reference?: string | null;
    notes?: string | null;
    status: PaymentStatusType;
    voidedAt?: string | null;
    voidedBy?: number | null;
    voidReason?: string | null;
    registeredBy: number;
    createdAt: string;
    updatedAt: string;

    treatment?: Treatment & {
        patient?: {
            id: number;
            fullName: string;
            medicalRecordNum: string;
        }
    };
    user?: {
        id: number;
        name: string;
    };
    voidedByUser?: {
        id: number;
        name: string;
    };
}

export interface PendingBalance {
    treatmentId: number;
    treatmentName: string;
    patientName: string;
    patientId: number;
    totalCost: number;
    discount: number;
    finalAmount: number;
    amountPaid: number;
    remainingBalance: number;
    status: 'PENDING' | 'PARTIAL';
}

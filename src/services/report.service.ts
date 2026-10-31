// src/services/report.service.ts
import api from './api';

export const reportService = {
    getDailyClosure: async (date: string) => {
        const response = await api.get(`/reports/daily-closure?date=${date}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getMonthlyIncome: async (month: string) => {
        const response = await api.get(`/reports/monthly-income?month=${month}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getPatientHistory: async (patientId: number) => {
        const response = await api.get(`/reports/patient-history/${patientId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getDebts: async () => {
        const response = await api.get(`/reports/debts`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getVoidedPayments: async () => {
        const response = await api.get(`/reports/voided-payments`, {
            responseType: 'blob',
        });
        return response.data;
    },
};
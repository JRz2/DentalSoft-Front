import api from './api';
import {
  DashboardData,
  DashboardStats,
  WeeklyActivity,
  DashboardAppointment,
  WeeklyAppointment,
  MonthlyData,
  WeeklyTreatmentsResponse,
  ApiResponse,
  initialDashboardData
} from '@/types/dashboard';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      const prevWeekStartStr = format(previousWeekStart, 'yyyy-MM-dd');
      const prevWeekEndStr = format(previousWeekEnd, 'yyyy-MM-dd');

      const [
        statsResponse,
        weeklyActivityResponse,
        weeklyTreatmentsResponse,
        previousWeekActivityResponse,
        weekAppointmentsResponse,
        monthlyDataResponse
      ] = await Promise.all([
        this.getStats(),
        this.getWeeklyActivity({
          weekStart: weekStartStr,
          weekEnd: weekEndStr
        }),
        this.getWeeklyTreatments({
          weekStart: weekStartStr,
          weekEnd: weekEndStr
        }),
        this.getWeeklyActivity({
          weekStart: prevWeekStartStr,
          weekEnd: prevWeekEndStr
        }),
        this.getWeekAppointments(),
        this.getMonthlyData()
      ]);

      let weekAppointments: WeeklyAppointment[] = [];
      if (weekAppointmentsResponse?.data) {
        if (Array.isArray(weekAppointmentsResponse.data)) {
          weekAppointments = weekAppointmentsResponse.data;
        } else if (Array.isArray((weekAppointmentsResponse.data as any).appointments)) {
          weekAppointments = (weekAppointmentsResponse.data as any).appointments;
        }
      }

      return {
        statistics: statsResponse?.data || initialDashboardData.statistics,
        weeklyActivity: weeklyActivityResponse?.data || initialDashboardData.weeklyActivity,
        weeklyTreatments: weeklyTreatmentsResponse?.data || initialDashboardData.weeklyTreatments,
        previousWeekActivity: previousWeekActivityResponse?.data || initialDashboardData.previousWeekActivity,
        weekAppointments: weekAppointments,
        monthlyData: monthlyDataResponse?.data || initialDashboardData.monthlyData
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return initialDashboardData;
    }
  }

  // ============ ESTADÍSTICAS ============
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        success: false,
        data: initialDashboardData.statistics,
        message: 'Error fetching stats',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============ CITAS DEL DÍA ============
  async getTodayAppointments(doctorId?: number): Promise<ApiResponse<DashboardAppointment[]>> {
    try {
      const params: any = {};
      if (doctorId) params.doctorId = doctorId;
      
      const response = await api.get<ApiResponse<DashboardAppointment[]>>('/dashboard/appointments/today', { params });
      return {
        ...response.data,
        data: Array.isArray(response.data?.data) ? response.data.data : []
      };
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      return {
        success: false,
        data: [],
        message: 'Error fetching today appointments',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============ CITAS DE LA SEMANA ============
  async getWeekAppointments(date?: string, doctorId?: number): Promise<ApiResponse<any>> {
    try {
      const params: any = {};
      if (date) params.date = date;
      if (doctorId) params.doctorId = doctorId;
      
      const response = await api.get<ApiResponse<any>>('/dashboard/appointments/week/list', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching week appointments:', error);
      return {
        success: false,
        data: { weekStart: '', weekEnd: '', total: 0, appointments: [] },
        message: 'Error fetching week appointments',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============ ACTIVIDAD SEMANAL (Citas) ============
  async getWeeklyActivity(params?: { weekStart?: string; weekEnd?: string }): Promise<ApiResponse<WeeklyActivity>> {
    try {
      const response = await api.get<ApiResponse<WeeklyActivity>>('/dashboard/appointments/week', { 
        params: params
      });
      
      const data = response.data?.data || initialDashboardData.weeklyActivity;
      
      return {
        ...response.data,
        data: {
          ...data,
          days: Array.isArray(data.days) ? data.days : []
        }
      };
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
      return {
        success: false,
        data: initialDashboardData.weeklyActivity,
        message: 'Error fetching weekly activity',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============ TRATAMIENTOS SEMANALES ============
  async getWeeklyTreatments(params?: { weekStart?: string; weekEnd?: string }): Promise<ApiResponse<WeeklyTreatmentsResponse>> {
    try {
      const response = await api.get<ApiResponse<WeeklyTreatmentsResponse>>('/dashboard/treatments/week/by-status', { 
        params: params
      });
      
      const data = response.data?.data || { weekStart: '', weekEnd: '', total: 0, treatments: [] };
      
      return {
        ...response.data,
        data
      };
    } catch (error) {
      console.error('Error fetching weekly treatments:', error);
      return {
        success: false,
        data: { weekStart: '', weekEnd: '', total: 0, statusBreakdown: [], days: [] },
        message: 'Error fetching weekly treatments',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============ DATOS MENSUALES ============
  async getMonthlyData(year?: number, month?: number): Promise<ApiResponse<MonthlyData>> {
    try {
      const params: any = {};
      if (year) params.year = year;
      if (month) params.month = month;
      
      const response = await api.get<ApiResponse<MonthlyData>>('/dashboard/appointments/month', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      return {
        success: false,
        data: initialDashboardData.monthlyData,
        message: 'Error fetching monthly data',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const dashboardService = new DashboardService();
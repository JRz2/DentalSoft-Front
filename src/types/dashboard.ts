export interface DashboardStats {
  totalPatients: number;
  pendingAppointments: number;
  activeTreatments: number;
  monthlyIncome: number;
}

export interface DashboardDay {
  date: string;
  dayOfWeek: number;
  patientsCount: number;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface DayStatuses {
  SCHEDULED: number;
  COMPLETED: number;
  CONFIRMED: number;
}

export interface WeeklyDayDetail {
  date: string;
  dayOfWeek: number;
  statuses: DayStatuses;
  total: number;
}

export interface WeeklyActivity {
  weekStart: string;
  weekEnd: string;
  total: number;
  statusBreakdown: StatusBreakdown[];
  days: WeeklyDayDetail[];
}

export interface DashboardAppointment {
  id: number;
  patientName: string;
  patientPhoto: string | null;
  treatment: string;
  time: string;
  status: string;
  duration: number;
}

export interface WeeklyAppointment extends DashboardAppointment {
  date: string;
  dayOfWeek: number;
  doctorName: string | null;
}

export interface MonthlyData {
  year: number;
  month: number;
  daysWithAppointments: number[];
  totalAppointments: number;
}

export interface DashboardData {
  statistics: DashboardStats;
  weeklyActivity: WeeklyActivity;
  weeklyTreatments: WeeklyTreatmentsResponse;
  previousWeekActivity: WeeklyActivity;
  weekAppointments: WeeklyAppointment[];
  monthlyData: MonthlyData;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export const initialDashboardData: DashboardData = {
  statistics: {
    totalPatients: 0,
    pendingAppointments: 0,
    activeTreatments: 0,
    monthlyIncome: 0
  },
  weeklyActivity: {
    weekStart: '',
    weekEnd: '',
    total: 0,
    statusBreakdown: [],
    days: []
  },
  weeklyTreatments: {
    weekStart: '',
    weekEnd: '',
    total: 0,
    statusBreakdown: [],
    days: []
  },
  previousWeekActivity: {
    weekStart: '',
    weekEnd: '',
    total: 0,
    statusBreakdown: [],
    days: []
  },
  weekAppointments: [],
  monthlyData: {
    year: 0,
    month: 0,
    daysWithAppointments: [],
    totalAppointments: 0
  }
};

export interface TreatmentWeekly {
  id: number;
  name: string;
  description: string | null;
  type: string;
  status: string;
  patientName: string;
  doctorName: string;
  totalCost: number;
  createdAt: string;
  date: string;
  time: string;
};

export interface TreatmentStatusBreakdown {
  status: string;
  count: number;
  percentage: number;
}

export interface TreatmentDayStatuses {
  [key: string]: number; 
}

export interface TreatmentDayDetail {
  date: string;
  dayOfWeek: number;
  statuses: TreatmentDayStatuses;
  total: number;
}

export interface WeeklyTreatmentsResponse {
  weekStart: string;
  weekEnd: string;
  total: number;
  statusBreakdown: TreatmentStatusBreakdown[];
  days: TreatmentDayDetail[];
}
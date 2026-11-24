import { api } from './api';
import type { DashboardResponse } from '@/types';

export const dashboardService = {
  getDashboard: (signal?: AbortSignal) => api.get<DashboardResponse>('/dashboard', { signal }),
};

export interface Agent {
  label: string;
  value: string;
}

export interface Vessel {
  label: string;
  value: string;
}

export interface VesselType {
  label: string;
  value: string;
}

export interface Material {
  label: string;
  value: string;
}

interface statusOptions {
  id: number;
  label: string;
  value: string;
}

export interface StatusOption {
  label: string;
  value: number;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { label: 'Expected', value: 1 },
  { label: 'Sail', value: 2 },
  { label: 'Ordered', value: 3 },
];

export interface Job {
  id: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  comments: string;
  status: string;
  invoiceNumber: string | null;
  vesselId: number;
  typeId: number;
  movementId: number;
  berthId: number;
  lengthId: number;
  agentId: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  orderStatus: statusOptions;
  staffJobs: StaffJob[];
  vessel: {
    id: number;
    label: string;
    value: string;
    isActive: boolean;
  };
  type: {
    id: number;
    label: string;
    value: string;
    isActive: boolean;
  };
  movement: {
    id: number;
    label: string;
    value: string;
    isActive: boolean;
  };
  berth: {
    id: number;
    label: string;
    value: string;
    isActive: boolean;
  };
  agent: {
    id: number;
    label: string;
    value: string;
    isActive: boolean;
  };
  length: {
    id: number;
    label: string;
    value: string;
    isActive: boolean;
  };
}

export interface StaffJob {
  id: number;
  jobId: number;
  staffId: string;
  staff: {
    id: string;
    name: string;
    email: string;
    loginName: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface User {
  createdAt: string; // ISO date string
  email: string;
  id: string;
  isActive: boolean;
  location: string | null;
  loginName: string;
  name: string;
  phone: string;
  role: "USER" | "ADMIN" | string; // Can be more specific if role set is fixed
  updatedAt: string; // ISO date string
}
export const statusColors = {
  expected: 'bg-blue-100 text-blue-800',
  sail: 'bg-green-100 text-green-800',
  ordered: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

// React Native compatible status colors
export const statusColorsRN = {
  expected: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  sail: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  ordered: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  completed: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  cancelled: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
};

export interface Berth {
  label: string;
  value: string;
}

export interface Staff {
  label: string;
  value: string;
}

export interface DateOption {
  label: string;
  value: string;
}

export interface LengthOption {
  label: string;
  value: number;
}

export interface Comment {
  label: string;
  value: string;
}

export interface MooringLogFormData {
  agent: string | null;
  date: string | null;
  vessel: string | null;
  type: string | null;
  length: number | null;
  material: string | null;
  berth: string | null;
  staff: string | null;
  comments: string | null;
}

// ── Leave Types ──────────────────────────────
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeaveType = "ANNUAL" | "SICK" | "EMERGENCY" | "UNPAID" | "OTHER";

export const LEAVE_TYPE_OPTIONS: { label: string; value: LeaveType }[] = [
  { label: "Annual Leave", value: "ANNUAL" },
  { label: "Sick Leave", value: "SICK" },
  { label: "Emergency Leave", value: "EMERGENCY" },
  { label: "Unpaid Leave", value: "UNPAID" },
  { label: "Other", value: "OTHER" },
];

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  ANNUAL: "#3B82F6",
  SICK: "#EF4444",
  EMERGENCY: "#F97316",
  UNPAID: "#6B7280",
  OTHER: "#8B5CF6",
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, { bg: string; text: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E" },
  APPROVED: { bg: "#FEE2E2", text: "#B91C1C" },
  REJECTED: { bg: "#FEE2E2", text: "#991B1B" },
  CANCELLED: { bg: "#F3F4F6", text: "#374151" },
};

export interface StaffLeave {
  id: number;
  staffId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  leaveType: LeaveType;
  adminNote?: string;
  status: LeaveStatus;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role?: string;
  };
}

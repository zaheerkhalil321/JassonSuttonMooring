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

export interface User {
  id: string;
  name: string;
  email: string;
  loginName: string;
  role?: string;
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

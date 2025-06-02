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

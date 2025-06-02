import {Agent, Vessel, VesselType, Material} from '../types';

// Agent options based on the image
export const agentOptions: Agent[] = [
  {label: 'DSG', value: 'DSG'},
  {label: 'CDC', value: 'CDC'},
  {label: 'KC', value: 'KC'},
  {label: 'NAVY', value: 'NAVY'},
  {label: 'Other', value: 'other'},
];

// Vessel name options based on the image
export const vesselOptions: Vessel[] = [
  {label: 'Chaperon', value: 'chaperon'},
  {label: 'Add New Vessel...', value: 'add_new'},
];

// Type options based on the image
export const typeOptions: VesselType[] = [
  {label: 'RoRo', value: 'roro'},
  {label: 'LoCo', value: 'loco'},
  {label: 'Tanker', value: 'tanker'},
  {label: 'Bulker', value: 'bulker'},
  {label: 'Liner', value: 'liner'},
  {label: 'Car', value: 'car'},
  {label: 'Other', value: 'other'},
];

// Material options based on the image
export const materialOptions: Material[] = [
  {label: 'Mixed/Unknown', value: 'mixed'},
  {label: 'Breakaway', value: 'breakaway'},
  {label: 'Safety Line', value: 'safety_line'},
  {label: 'Dyneema', value: 'dyneema'},
  {label: 'Gangway Dept', value: 'gangway_dept'},
  {label: 'Other', value: 'other'},
];

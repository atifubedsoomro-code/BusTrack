export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  role: UserRole;
  rollNumber?: string;
}

export type BusId = 'bus_1' | 'bus_2' | 'bus_3' | 'bus_4' | 'bus_5' | 'bus_6' | 'bus_7';

export interface BusLocation {
  lat: number;
  lng: number;
  updatedAt: string;
  driverId: string;
  busId: BusId;
  status: 'active' | 'stopped';
}

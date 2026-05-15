export type UserRole = 'admin' | 'student';

export interface UserProfile {
  uid: string;
  role: UserRole;
  rollNumber?: string;
}

export interface BusLocation {
  lat: number;
  lng: number;
  updatedAt: string;
  driverId: string;
  busId: string;
  status: 'active' | 'stopped';
}

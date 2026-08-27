
export enum Category {
  FACULTY = 'Faculty & College',
  DEPARTMENT = 'Department & Academic Complex',
  LECTURE_THEATRE = 'Lecture Theatre & Classroom',
  ADMIN = 'Administrative Building',
  STUDENT_SERVICE = 'Student Service & Facility',
  HOSTEL = 'Hostel & Residential',
  LANDMARK = 'Gate & Landmark'
}

export interface Location {
  id: string;
  name: string;
  category: Category;
  description: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  locationId?: string;
}

export interface NavigationState {
  currentLocation?: Location;
  destination?: Location;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'staff' | 'visitor';
}

export interface AuthResponse {
  user: User;
  token: string;
}

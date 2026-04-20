// Weather types
export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
}

// User types
export interface User {
  _id: string;
  email: string;
  role: "guest" | "user" | "organizer" | "admin";
  firstName: string;
  lastName: string;
  phone?: string;
  tripsAsParticipant: number;
  tripsAsOrganizer: number;
  skills: string[];
  mainSkills: string[];
  allergies: string[];
  medicalConditions: string[];
  dietaryRestrictions: string[];
  aboutMe?: string;
  organizedTrips: Trip[] | string[];
  joinedTrips: Trip[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

// Trip types
export interface Trip {
  _id: string;
  title: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  difficulty: "easy" | "medium" | "hard";
  price: number;
  maxParticipants: number;
  createdBy: User | string;
  participants: (User | string)[];
  status: "planning" | "active" | "completed" | "cancelled";
  currentParticipants?: number;
  durationDays?: number;
  availableSpots?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Application types
export interface Application {
  _id: string;
  userId: User | string;
  tripId: Trip | string;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  appliedAt: string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Trip filters
export interface TripFilters {
  destination?: string;
  startDate?: string;
  minPrice?: number;
  maxPrice?: number;
  difficulty?: string;
  minDuration?: number;
  maxDuration?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

// Profile update
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  skills?: string[];
  mainSkills?: string[];
  aboutMe?: string;
  allergies?: string[];
  medicalConditions?: string[];
  dietaryRestrictions?: string[];
}

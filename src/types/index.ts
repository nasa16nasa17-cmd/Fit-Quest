export type UserRole = 'admin' | 'trainer' | 'buyer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  isApproved?: boolean;
}

export interface TrainerProfile {
  id: string;
  userId: string;
  sport: string;
  categories: string[];
  specializations: string[];
  languages: string[];
  location: string;
  isOnline: boolean;
  isInPerson: boolean;
  experience: number;
  certifications: string[];
  bio: string;
  philosophy: string;
  sessionPrice: number;
  monthlyPlanPrice?: number;
  videoUrl?: string;
  rating?: number;
  reviewCount?: number;
  sessionsCompleted: number;
  responseTime: string;
  bannerUrl?: string;
  isFeatured?: boolean;
  isVerified?: boolean;
  isApproved?: boolean;
  successfulBookingsCount?: number;
  memberSince?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
export type BookingType = 'session' | 'package' | 'monthly';

export interface Booking {
  id: string;
  trainerId: string;
  buyerId: string;
  trainerName: string;
  buyerName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionType: string;
  price: number;
  bookingStatus: BookingStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  amount?: number;
  commission?: number;
  type?: BookingType;
}

export interface Review {
  id: string;
  bookingId: string;
  buyerId: string;
  trainerId: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyerName?: string;
  isHidden?: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  trainerId: string;
  clientId: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadCount?: { [uid: string]: number };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read?: boolean;
}

export type CallStatus = 'ringing' | 'active' | 'ended' | 'missed';

export interface Call {
  id: string;
  chatId: string;
  callerId: string;
  receiverId: string;
  status: CallStatus;
  roomName: string;
  createdAt: string;
  endedAt?: string;
}

export interface Availability {
  id: string;
  trainerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

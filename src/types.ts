export interface Candidate {
  id: string;
  name: string;
  email: string;
  bio: string;
  photoUrl: string;
  category: 'Fashion' | 'Art' | 'Design';
  voteCount: number;
  isEligible?: boolean;
  status?: 'active' | 'pending' | 'elite' | 'disqualified';
  createdAt: string;
  isVotingActive?: boolean; // toggle if voting is open/closed for this candidate
  voteGoal?: number; // customizable goal, e.g. 2000
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  image: string;
  date: string;
  author: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  candidateId: string;
  voterEmail: string;
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  transactionId: string;
  createdAt: string;
}

export interface Settings {
  moneyFusionApiKey: string;
  moneyFusionMerchantId: string;
  votePrice: number;
  isVotingEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  role: 'admin' | 'candidate';
  candidateId?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // Recipient
  title: string;
  message: string;
  type: 'vote' | 'status' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Prize {
  id: string;
  title: string;
  description: string;
  image: string;
  order: number;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  category: 'platinum' | 'gold' | 'silver' | 'media' | 'other';
  websiteUrl?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface PartnerRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  category: 'platinum' | 'gold' | 'silver' | 'media' | 'other';
  message: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'declined';
}


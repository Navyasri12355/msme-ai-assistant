// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: string;
    suggestion?: string;
    timestamp: Date;
  };
}

// Auth types
export interface User {
  id: string;
  email: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Business Profile types
export type BusinessType = 
  | 'retail'
  | 'restaurant'
  | 'service'
  | 'manufacturing'
  | 'wholesale'
  | 'e-commerce'
  | 'consulting'
  | 'other';

export type Industry =
  | 'food-beverage'
  | 'retail'
  | 'technology'
  | 'healthcare'
  | 'education'
  | 'construction'
  | 'agriculture'
  | 'textiles'
  | 'automotive'
  | 'hospitality'
  | 'professional-services'
  | 'other';

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  industry: Industry;
  location: string;
  targetAudience: string;
  monthlyRevenue?: number;
  employeeCount: number;
  establishedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessProfileData {
  businessName: string;
  businessType: BusinessType;
  industry: Industry;
  location: string;
  targetAudience: string;
  monthlyRevenue?: number;
  employeeCount: number;
  establishedDate: string;
}

export interface UpdateBusinessProfileData {
  businessName?: string;
  businessType?: BusinessType;
  industry?: Industry;
  location?: string;
  targetAudience?: string;
  monthlyRevenue?: number;
  employeeCount?: number;
  establishedDate?: string;
}

// Conversational AI types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  dataReferences?: DataReference[];
}

export interface DataReference {
  type: 'metric' | 'transaction' | 'forecast' | 'insight';
  id: string;
  value: any;
}

export interface ConversationContext {
  previousMessages: Message[];
  userBusinessProfile?: BusinessProfile;
  currentTopic?: string;
}

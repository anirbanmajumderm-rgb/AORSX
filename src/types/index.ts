export interface AdminType {
  id: number;
  username: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
}

export interface ProjectType {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  technologies: string | null;
  clientName: string | null;
  companyName: string | null;
  projectUrl: string | null;
  image: string | null;
  featured: boolean;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  reviews: ReviewType[];
}

export interface ReviewType {
  id: number;
  projectId: number;
  reviewerName: string;
  reviewerEmail: string | null;
  rating: number;
  reviewText: string | null;
  isApproved: boolean;
  isSpam: boolean;
  createdAt: Date;
}

export interface SkillType {
  id: number;
  category: string;
  name: string;
  proficiency: number;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export interface FAQType {
  id: number;
  question: string;
  answer: string | null;
  order: number;
  isActive: boolean;
}

export interface QuestionType {
  id: number;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string | null;
  question: string;
  adminReply: string | null;
  isImportant: boolean;
  isSpam: boolean;
  status: string;
  createdAt: Date;
}

export interface ContactType {
  id: number;
  type: string;
  value: string;
  label: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export interface ServiceType {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export interface WhyChooseMeType {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

export interface AIResponseType {
  id: number;
  keyword: string;
  response: string;
  category: string;
  isActive: boolean;
}

export interface SettingType {
  id: number;
  key: string;
  value: string | null;
  type: string;
}

export interface UploadedFileType {
  id: number;
  originalName: string;
  storedName: string;
  filePath: string;
  fileType: string | null;
  fileSize: number | null;
  uploadType: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalProjects: number;
  totalSkills: number;
  totalQuestions: number;
  totalReviews: number;
  totalContacts: number;
  totalServices: number;
  pendingQuestions: number;
  pendingReviews: number;
}

export enum Role {
  BOSS = 'BOSS',
  WORKER = 'WORKER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum Priority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum EmailStatus {
  DETECTED = 'DETECTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export enum Category {
  ACCOUNT_STATEMENT = 'Account Statement',
  TRANSACTION_ALERT = 'Transaction Alert',
  LOAN_CORRESPONDENCE = 'Loan Correspondence',
  PAYMENT_NOTIFICATION = 'Payment Notification',
  GENERAL = 'General Banking'
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'success' | 'warning' | 'alert' | 'info';
  targetRole?: Role;
  targetUserId?: string;
}

export interface BankEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: Date;
  bankName: string;
  category: Category;
  priority: Priority;
  status: EmailStatus;
  assignedWorkerId?: string;
  reportContent?: string;
  supervisorComments?: string;
  attachments: string[]; // Mock URLs
  history: WorkflowEvent[];
}

export interface WorkflowEvent {
  date: Date;
  action: string;
  actor: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  status?: 'Available' | 'Busy' | 'Offline';
}

export interface Reminder {
  id: string;
  emailId: string;
  targetUserId: string;
  message: string;
  dueAt: Date;
  processed: boolean;
  createdBy: string;
}
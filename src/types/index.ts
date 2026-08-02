export type Role = "admin" | "staff" | "viewer";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

export type PolicyStatus = "active" | "expired" | "cancelled" | "pending";
export type ReminderStatus = "pending" | "done" | "expired" | "cancelled";
export type ReminderChannel = "sms" | "email" | "app";

export interface Company {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Broker {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = "person" | "company";

export interface Customer {
  id: string;
  customerType?: CustomerType;
  firstName: string;
  lastName?: string;
  gender?: string;
  companyName?: string;
  companyType?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceType {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  customerId: string;
  companyId: string;
  insuranceTypeId: string;
  brokerId?: string;
  premium: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: PolicyStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  policyId: string;
  type: "renewal" | "payment" | "custom";
  title: string;
  dueDate: string;
  channel: ReminderChannel;
  status: ReminderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message?: string;
  link?: string;
  key?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

export interface SettingsDoc {
  companyName: string;
  logo?: string;
  defaultReminderDays: number;
  reminderChannels: ReminderChannel[];
  currency: string;
}

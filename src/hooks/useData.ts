import { useCollection, useDoc } from "@/hooks/useFirestore";
import type {
  Broker,
  Company,
  Customer,
  InsuranceType,
  Policy,
  Reminder,
  SettingsDoc,
  UserProfile,
} from "@/types";

export function useCompanies() {
  return useCollection<Company>("companies");
}
export function useBrokers() {
  return useCollection<Broker>("brokers");
}
export function useCustomers() {
  return useCollection<Customer>("customers");
}
export function useInsuranceTypes() {
  return useCollection<InsuranceType>("insuranceTypes");
}
export function usePolicies() {
  return useCollection<Policy>("policies");
}
export function useReminders() {
  return useCollection<Reminder>("reminders");
}
export function useUsers() {
  return useCollection<UserProfile>("users");
}
export function useSettings() {
  return useDoc<SettingsDoc>("settings/general");
}
export function usePolicy(id?: string) {
  return useDoc<Policy>(`policies/${id ?? "none"}`);
}
export function useReminder(id?: string) {
  return useDoc<Reminder>(`reminders/${id ?? "none"}`);
}
export function useCustomer(id?: string) {
  return useDoc<Customer>(`customers/${id ?? "none"}`);
}
export function useCompany(id?: string) {
  return useDoc<Company>(`companies/${id ?? "none"}`);
}
export function useBroker(id?: string) {
  return useDoc<Broker>(`brokers/${id ?? "none"}`);
}

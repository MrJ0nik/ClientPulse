// src/app/(private)/Home/types.ts
export type TabName =
  | "Dashboard"
  | "Accounts"
  | "Timeline"
  | "Decision Makers"
  | "Marketplace"
  | "Team"
  | "Market"
  | "Settings";

export interface NavItem {
  label: TabName;
  icon: React.ComponentType<{ isActive?: boolean }>;
}

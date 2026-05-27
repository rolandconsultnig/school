export type SchoolTier = "NURSERY" | "PRIMARY" | "SECONDARY";

export type ProfileType =
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "PARENT"
  | "APPLICANT";

export interface AuthUser {
  token: string;
  email: string;
  name?: string;
  profileType: ProfileType;
  profileId: string;
  roleCode?: string;
}

export interface TenantState {
  campusId: string;
  tier: SchoolTier;
}

export interface ApiRecord {
  id?: string;
  _id?: string;
  [key: string]: unknown;
}

export interface Campus extends ApiRecord {
  name: string;
  code: string;
  tiers?: { tier: SchoolTier }[];
}

export interface Organization extends ApiRecord {
  name: string;
  slug: string;
  campuses?: Campus[];
}

export interface BootstrapData {
  tiers: { tier: SchoolTier; label: string }[];
  organizations: Organization[];
}

export function recordId(r: ApiRecord | null | undefined): string {
  if (!r) return "";
  return String(r.id ?? r._id ?? "");
}

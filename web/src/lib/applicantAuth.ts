const STORAGE_KEY = "schoolportal_applicant";

export type ApplicantSession = {
  token: string;
  email: string;
  name: string;
  applicantId: string;
};

export function loadApplicant(): ApplicantSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ApplicantSession) : null;
  } catch {
    return null;
  }
}

export function saveApplicant(session: ApplicantSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearApplicant() {
  localStorage.removeItem(STORAGE_KEY);
}

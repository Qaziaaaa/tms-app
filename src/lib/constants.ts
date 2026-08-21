export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
} as const;

export const SUBMISSION_STATUS = {
  SUBMITTED: "SUBMITTED",
  LATE: "LATE",
  NOT_SUBMITTED: "NOT_SUBMITTED",
} as const;

export const GRADE_SCALE: { min: number; max: number; grade: string }[] = [
  { min: 90, max: 100, grade: "A+" },
  { min: 80, max: 89, grade: "A" },
  { min: 70, max: 79, grade: "B+" },
  { min: 60, max: 69, grade: "B" },
  { min: 50, max: 59, grade: "C+" },
  { min: 40, max: 49, grade: "C" },
  { min: 30, max: 39, grade: "D" },
  { min: 0, max: 29, grade: "F" },
];

export const APP_NAME = "TMS";
export const APP_FULL_NAME = "Teacher Management System";

export const AI_CONFIG = {
  MODEL: "llama-3.1-8b-instant",
  TEMPERATURE: 0.3,
  MAX_TOKENS: 2000,
  API_URL: "https://api.groq.com/openai/v1/chat/completions",
  RISK_THRESHOLDS: {
    ATTENDANCE_HIGH: 40,
    ATTENDANCE_MEDIUM: 30,
    SUBMISSION_HIGH: 60,
    SUBMISSION_MEDIUM: 50,
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 200,
} as const;

export const RECENT_ITEMS_LIMIT = 5;

export const BCRYPT_ROUNDS = 10;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

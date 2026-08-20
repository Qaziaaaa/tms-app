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

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

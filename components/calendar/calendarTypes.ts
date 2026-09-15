export type EventType = "deadline" | "interview" | "reminder";
export type CalendarEvent = {
  id: string | number;
  applicationId: string;
  type: EventType;
  title: string;
  organisation: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
};
export const eventStyles: Record<EventType, string> = {
  deadline: "bg-rose-50 text-rose-700 ring-rose-600/20",

  interview: "bg-blue-50 text-blue-700 ring-blue-600/20",

  reminder: "bg-amber-50 text-amber-700 ring-amber-600/20",
};
export const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

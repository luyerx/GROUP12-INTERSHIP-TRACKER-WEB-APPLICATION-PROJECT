import type { ApplicationStatus } from "@/components/applications/detailTypes";

const suggestions: Record<ApplicationStatus, string> = {
  Interested: "Review the opportunity and decide whether to prepare an application.",
  Preparing: "Complete your application materials and apply when ready.",
  Applied: "Check for updates and plan a follow-up if appropriate.",
  Interview: "Prepare for interviews and keep your calendar up to date.",
  Offer: "Review the offer and decide how you would like to respond.",
  Rejected: "Reflect on feedback and explore other opportunities.",
  Withdrawn: "Review your priorities and explore other opportunities.",
};

export function getApplicationProgressItems(status: ApplicationStatus) {
  return [
    { title: status, subtitle: "Current status in your tracker", active: true },
    { title: "Suggested next step", subtitle: suggestions[status], active: false },
  ];
}

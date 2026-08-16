export const applicationStatuses = [
  "Interested",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type ApplicationStatus =
  (typeof applicationStatuses)[number];

export type Application = {
  id: number;
  organisation: string;
  roleTitle: string;
  location: string;
  sourceLink: string;
  deadline: string;
  status: ApplicationStatus;
  jobDescription: string;
  contactPerson: string;
  outcome: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const applications: Application[] = [
  {
    id: 1,
    organisation: "Google",
    roleTitle: "Software Engineering Intern",
    location: "Auckland",
    sourceLink: "",
    deadline: "2026-08-18",
    status: "Applied",
    jobDescription: "",
    contactPerson: "",
    outcome: "",
    notes: "",
    createdAt: "2026-08-10T09:00:00.000Z",
    updatedAt: "2026-08-10T09:00:00.000Z",
  },
  {
    id: 2,
    organisation: "Microsoft",
    roleTitle: "Cloud Internship",
    location: "Wellington",
    sourceLink: "",
    deadline: "2026-08-20",
    status: "Interview",
    jobDescription: "",
    contactPerson: "",
    outcome: "",
    notes: "",
    createdAt: "2026-08-11T09:00:00.000Z",
    updatedAt: "2026-08-11T09:00:00.000Z",
  },
];

export function isApplicationStatus(
  value: unknown
): value is ApplicationStatus {
  return (
    typeof value === "string" &&
    applicationStatuses.includes(
      value as ApplicationStatus
    )
  );
}

export function getNextApplicationId() {
  if (applications.length === 0) {
    return 1;
  }

  return Math.max(
    ...applications.map((application) => application.id)
  ) + 1;
}
export type Application = {
  id: number;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: string;
};

export const applications: Application[] = [
  {
    id: 1,
    organisation: "Google",
    roleTitle: "Software Engineering Intern",
    location: "Auckland",
    deadline: "2026-08-18",
    status: "Applied",
  },
  {
    id: 2,
    organisation: "Microsoft",
    roleTitle: "Cloud Internship",
    location: "Wellington",
    deadline: "2026-08-20",
    status: "Interview",
  },
];
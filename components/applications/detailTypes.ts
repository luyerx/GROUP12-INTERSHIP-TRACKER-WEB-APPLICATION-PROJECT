export type ApplicationStatus =
  | "Interested"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";
export type Application = {
  opportunityId?: string;
  id: string;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: ApplicationStatus;
  sourceLink?: string;
  contactPerson?: string;
  jobDescription?: string;
  notes?: string;
  outcome?: string;
  createdAt?: string;
  updatedAt?: string;
};

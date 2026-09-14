export type AdminUser = {
  id: string;
  name: string;
  email: string;
  programme: string;
  role: "Student" | "Admin" | "Employee";
  status: "Active" | "Suspended";
  joined: string;
};

export type AdminResource = {
  description?: string;
  url?: string;
  featured?: boolean;
  source?: string;
  id: string;
  title: string;
  category: string;
  type: "Guide" | "Article" | "Template" | "Video";
  status: "Published" | "Draft";
  updated: string;
};

export type AdminOpportunity = {
  id: string;
  organisation: string;
  role: string;
  location: string;
  closingDate: string;
  status: "Published" | "Draft" | "Closed";
  applications: number;
};

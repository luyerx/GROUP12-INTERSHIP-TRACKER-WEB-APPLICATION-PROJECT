export const currentUser = {
  id: "USR-1045",
  firstName: "Yanzhen",
  fullName: "Yanzhen Cheng",
  email: "admin@example.test",

  university: "Massey University",
  degree: "Bachelor of Information Sciences",
  major: "Software Engineering",
  graduationYear: "2026",

  location: "Auckland",
  programme: "Information Sciences",

  preferredRoles: [
    "Software Engineering",
    "Frontend Development",
  ],

  preferredLocations: [
    "Auckland",
    "Wellington",
    "Remote",
  ],

  skills: [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
  ],

  openToInternships: true,

  notifications: {
    email: true,
    deadlineReminders: true,
    interviewReminders: true,
  },
} as const;
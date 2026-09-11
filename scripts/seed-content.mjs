import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "internship_tracker";

if (!uri) throw new Error("MONGODB_URI is required.");

const resources = [
  ["How to Write a Strong Internship CV", "A practical guide to structuring a clear student CV and presenting skills, education, and experience effectively.", "CV & Cover Letter", "Guide", true, "Career Centre"],
  ["Preparing for Behavioural Interviews", "Learn how to answer common behavioural interview questions using a clear and structured approach.", "Interviews", "Guide", true, "Career Centre"],
  ["Internship Application Checklist", "Use this checklist before submitting an internship application to make sure important details are complete.", "Applications", "Template", true, "Internship Tracker"],
  ["Writing an Effective Cover Letter", "Understand how to tailor a cover letter to the organisation, position, and skills listed in a job advertisement.", "CV & Cover Letter", "Article", false, "Career Centre"],
  ["STAR Interview Response Framework", "A concise overview of the STAR framework for answering experience-based interview questions.", "Interviews", "Video", false, "Student Careers"],
  ["Researching a Company Before Applying", "Learn what information to research before applying and how company research can improve applications and interviews.", "Applications", "Article", false, "Career Centre"],
  ["Graduate Career Planning Guide", "A starting point for identifying career goals, preferred industries, and graduate opportunities.", "Career Planning", "Guide", false, "Student Careers"],
  ["Technical Interview Preparation", "Explore key preparation areas for technical internship and graduate interviews.", "Interviews", "Article", false, "Internship Tracker"],
  ["Technical interview preparation", "Prepare for technical internship and graduate interviews.", "Interviews", "Guide", false, "Internship Tracker"],
  ["Graduate CV template", "A practical template for building a clear graduate CV.", "CV & Cover Letter", "Template", false, "Internship Tracker"],
  ["Building a career action plan", "Plan your next career development steps.", "Career Planning", "Video", false, "Internship Tracker"],
  ["Cover letter checklist", "A checklist for reviewing a tailored cover letter.", "CV & Cover Letter", "Guide", false, "Internship Tracker"],
];

const opportunities = [
  ["Xero", "Software Engineering Intern", "Auckland", "18 Sep 2026", "Published", 24],
  ["Fonterra", "Data Analytics Intern", "Hamilton", "22 Sep 2026", "Published", 17],
  ["Wellington City Council", "Digital Experience Intern", "Wellington", "28 Sep 2026", "Draft", 0],
  ["Datacom", "Graduate Cloud Consultant", "Auckland", "31 Aug 2026", "Closed", 31],
];

const client = new MongoClient(uri);
const timestamp = new Date();
try {
  await client.connect();
  const database = client.db(databaseName);
  const resourceCollection = database.collection("resources");
  const opportunityCollection = database.collection("opportunities");

  for (const [title, description, category, type, featured, source] of resources) {
    await resourceCollection.updateOne(
      { title },
      { $set: { title, description, category, type, featured, source, url: "", status: "Published", updatedAt: timestamp }, $setOnInsert: { createdAt: timestamp } },
      { upsert: true }
    );
  }

  for (const [organisation, role, location, closingDate, status, applications] of opportunities) {
    await opportunityCollection.updateOne(
      { organisation, role },
      { $set: { organisation, role, location, closingDate, status, applications, updatedAt: timestamp }, $setOnInsert: { createdAt: timestamp } },
      { upsert: true }
    );
  }

  console.log(`Seeded ${resources.length} resources and ${opportunities.length} opportunities.`);
} finally {
  await client.close();
}
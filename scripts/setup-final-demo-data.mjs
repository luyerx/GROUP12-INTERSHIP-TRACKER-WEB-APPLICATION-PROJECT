// ONE-TIME setup for the audited final demonstration database. Never run at startup.
// Audit: node scripts/setup-final-demo-data.mjs
// Apply ONCE: node scripts/setup-final-demo-data.mjs --apply --database internship_tracker
// Optional process-only DNS: FINAL_DEMO_DNS=1.1.1.1,8.8.8.8 (requires operator consent).
import assert from "node:assert/strict";
import dns from "node:dns";
import { pathToFileURL } from "node:url";
import { MongoClient, ObjectId } from "mongodb";
import nextEnv from "@next/env";

export const setupId = "final-demo-data-2026-12-v1";
export const owners = [
  { id: "6aa810e087f41274f9030c55", email: "employee@1.com", company: "Test Company NZ", previousCompany: "Test Company NZ" },
  { id: "6aa8c3b372747ba0417c9cf7", email: "employee@2.com", company: "Harbour Digital Demo", previousCompany: "" },
];
const applicationInstructions = "Course demonstration listing, not a live vacancy. Application exercise: prepare a CV and a short cover letter explaining your relevant project experience, then present them to the course demonstrator acting as the Employee publisher. Do not send personal documents to the demo account email. Add to My Tracker only saves this opportunity; it does not submit an application or contact an employer.";
export const plan = [
  { id: "6aa358f8bb4d522a95cc88ff", previousRole: "Software Engineering Intern", previousOrganisation: "Xero", previousStatus: "Published", previousDate: "2026-09-18", owner: 0, role: "Software Engineering Intern", location: "Auckland", workMode: "Hybrid", closingDate: "2026-12-15", summary: "Join a supervised software team for a 12-week internship beginning in January 2027. Build small web service features, write automated tests, review pull requests and document the changes you deliver.", requirements: "Suitable for a computing student with JavaScript or TypeScript fundamentals, Git experience and one university or personal software project. Mentoring and weekly code reviews are included. Expected commitment: 30 hours per week, with two office days." },
  { id: "6aa8ce9d72747ba0417c9cfe", previousRole: "Frontend Engineering Intern", previousOrganisation: "Test Company", previousStatus: "Published", previousDate: "2026-09-30", previousOwner: owners[0].id, owner: 0, role: "Frontend Developer Intern", location: "Auckland CBD", workMode: "Hybrid", closingDate: "2026-12-20", summary: "Help a product team improve accessible web interfaces during a 12-week internship beginning in January 2027. Implement responsive React components, connect existing APIs and test keyboard navigation and error states.", requirements: "Bring HTML, CSS and JavaScript knowledge and a small portfolio or course project. React familiarity is useful. You will pair with an engineer and receive design feedback. Expected commitment: 30 hours per week, with two office days." },
  { id: "6aa358f9bb4d522a95cc8900", previousRole: "Data Analytics Intern", previousOrganisation: "Fonterra", previousStatus: "Published", previousDate: "2026-09-22", owner: 1, role: "Data / AI Intern", location: "Hamilton", workMode: "Hybrid", closingDate: "2026-12-18", summary: "Support a supervised analytics project over 12 weeks beginning in January 2027. Clean synthetic datasets, build reproducible Python notebooks, evaluate a simple prediction baseline and communicate the limits of your results.", requirements: "Suitable for students familiar with Python, SQL and introductory statistics. Use only supplied synthetic or public datasets. Deliver a documented notebook and a short findings presentation. Expected commitment: 25 hours per week, with one team day on site." },
  { id: "6aa358f9bb4d522a95cc8902", previousRole: "Graduate Cloud Consultant", previousOrganisation: "Datacom", previousStatus: "Closed", previousDate: "2026-08-31", owner: 1, role: "Cybersecurity / Cloud Intern", location: "Auckland", workMode: "On-site", closingDate: "2026-12-28", summary: "Work with a mentor in an isolated cloud training environment for 12 weeks beginning in January 2027. Review access permissions, configure logging, document a backup recovery exercise and help maintain a basic security checklist.", requirements: "Bring basic networking, Linux and cloud concepts. All exercises are authorised and restricted to a training environment. No production access is required. Expected commitment: 30 hours per week on site, including weekly mentoring." },
  { id: "6aa358f9bb4d522a95cc8901", previousRole: "Digital Experience Intern", previousOrganisation: "Wellington City Council", previousStatus: "Draft", previousDate: "2026-09-28", owner: 1, role: "Digital Experience Intern", location: "Wellington", workMode: "Remote", closingDate: "2026-12-22", summary: "Improve the usability of a demonstration service during a 10-week internship beginning in January 2027. Map a user journey, build a clickable prototype, run supervised usability sessions with consenting participants and summarise recommendations.", requirements: "Suitable for students interested in UX, information systems or digital design. Include a design exercise or course project in your portfolio. Sessions use fictional data. Expected commitment: 20 hours per week, with scheduled remote team meetings." },
  { id: "6ab29b18e93706c25b071777", previousRole: "Updated Software Intern", previousOrganisation: "Admin CRUD Test Company", previousStatus: "Published", previousDate: "2026-10-30", previousOwner: "6aa360791191e8e3c030021c", owner: 0, role: "QA Automation Intern", location: "Christchurch", workMode: "Remote", closingDate: "2026-12-31", summary: "Support release quality for a demonstration web application over 12 weeks beginning in January 2027. Write test cases, automate a small set of browser workflows, reproduce defects and produce concise bug reports.", requirements: "Bring basic JavaScript, careful written communication and an interest in software testing. Browser automation experience is helpful but training is provided. Expected commitment: 25 hours per week, with remote pairing and weekly review." },
];
export function finalFields(item) {
  const owner = owners[item.owner];
  return { createdBy: new ObjectId(owner.id), organisation: owner.company, role: item.role, location: item.location, workMode: item.workMode, employmentType: "Internship", closingDate: item.closingDate, status: "Published", applicationUrl: "", description: `${item.summary}\n\n${item.requirements}\n\nPublished by the ${owner.company} Employee demo account.\n\n${applicationInstructions}` };
}
export async function audit(db) {
  const users = await db.collection("users").find({}, { projection: { fullName: 1, email: 1, role: 1, status: 1, companyName: 1 } }).toArray();
  const rows = await db.collection("opportunities").find({}).toArray();
  return { database: db.databaseName, employeeCount: users.filter(u => u.role === "employee").length, employees: users.filter(u => u.role === "employee"), opportunityCount: rows.length, publishedCount: rows.filter(r => r.status === "Published").length, opportunities: rows.map(row => {
    const owner = users.find(u => String(u._id) === String(row.createdBy));
    return { id: String(row._id), role: row.role, organisation: row.organisation, status: row.status, closingDate: row.closingDate, owner: owner || null, issue: !row.createdBy ? "missing-owner" : !owner ? "orphan" : owner.role !== "employee" ? "non-employee-owner" : owner.status !== "Active" ? "inactive-owner" : owner.companyName !== row.organisation ? "company-mismatch" : null };
  }) };
}
export async function applySetup(client, db) {
  const session = client.startSession();
  try {
    return await session.withTransaction(async () => {
      const options = { session };
      assert.equal(await db.collection("final_demo_setups").findOne({ _id: setupId }, options), null, "Already completed. Never rerun setup to overwrite website edits.");
      const previousUsers = [];
      for (const owner of owners) {
        const user = await db.collection("users").findOne({ _id: new ObjectId(owner.id) }, options);
        assert.ok(user && user.email === owner.email && user.role === "employee" && user.status === "Active", "Audited Active Employee changed; re-audit before writing.");
        assert.equal(user.companyName, owner.previousCompany, "Employee company changed; re-audit before writing.");
        previousUsers.push({ _id: user._id, companyName: user.companyName, companyDescription: user.companyDescription, updatedAt: user.updatedAt });
      }
      const previousOpportunities = [];
      for (const item of plan) {
        const row = await db.collection("opportunities").findOne({ _id: new ObjectId(item.id) }, options);
        assert.ok(row, "Audited opportunity missing.");
        assert.equal(row.role, item.previousRole);
        assert.equal(row.organisation, item.previousOrganisation);
        assert.equal(row.status, item.previousStatus);
        assert.equal(row.closingDate, item.previousDate);
        assert.equal(row.createdBy ? String(row.createdBy) : undefined, item.previousOwner);
        previousOpportunities.push(row);
      }
      const now = new Date();
      // A unique completion record and all six updates commit atomically.
      // Recovery snapshot contains no passwords or other user secrets.
      await db.collection("final_demo_setups").insertOne({ _id: setupId, completedAt: now, previousUsers, previousOpportunities }, options);
      await db.collection("users").updateOne({ _id: new ObjectId(owners[1].id) }, { $set: { companyName: owners[1].company, companyDescription: "Fictional digital services organisation for the course demonstration. No live vacancies or external applications are offered.", updatedAt: now } }, options);
      for (const item of plan) {
        const result = await db.collection("opportunities").updateOne({ _id: new ObjectId(item.id) }, { $set: { ...finalFields(item), updatedAt: now } }, options);
        assert.equal(result.matchedCount, 1);
      }
      return { updatedOpportunities: plan.length, reusedEmployees: owners.length, createdEmployees: 0, repairedMissingOwners: 4, repairedNonEmployeeOwners: 1 };
    });
  } finally { await session.endSession(); }
}
async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  if (process.env.FINAL_DEMO_DNS) dns.setServers(process.env.FINAL_DEMO_DNS.split(","));
  const apply = process.argv.includes("--apply");
  const configured = process.env.MONGODB_DB || "internship_tracker";
  const target = process.argv[process.argv.indexOf("--database") + 1];
  if (apply) assert.equal(target, configured, "Apply requires --database matching the configured application database.");
  assert.ok(process.env.MONGODB_URI, "MONGODB_URI is required.");
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(configured);
    if (apply) console.log(JSON.stringify(await applySetup(client, db)));
    console.log(JSON.stringify(await audit(db), null, 2));
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => {
  console.error(`Final demo setup failed (${error.name}, ${error.code || "validation"}). No credentials logged. Inspect the read-only audit before retrying.`);
  process.exitCode = 1;
});

import "server-only";
import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { ApplicationModel } from "@/lib/models/Application";
import { CalendarEventModel } from "@/lib/models/CalendarEvent";
import { ReminderLogModel } from "@/lib/models/ReminderLog";
import { UserModel } from "@/lib/models/User";
import { sendReminderEmail } from "@/lib/notifications/email";
import { CLAIM_LEASE_MS, runReminders, type Candidate, type Dependencies } from "@/lib/notifications/rules";

export async function executeReminders() {
  await connectToDatabase();
  // Ensure the unique index exists before any concurrent cron request claims work.
  await ReminderLogModel.init();
  const deps: Dependencies = {
    async applications() {
      const rows = await ApplicationModel.find({ deadline: { $ne: "" } }).select("_id userId organisation roleTitle deadline").lean();
      return rows.map((r): Candidate => ({ id: String(r._id), userId: String(r.userId), organisation: r.organisation, title: r.roleTitle, date: r.deadline }));
    },
    async interviews() {
      const rows = await CalendarEventModel.find({ type: "interview" }).select("_id userId applicationId organisation title date time").lean();
      return rows.map((r): Candidate => ({ id: String(r._id), userId: String(r.userId), applicationId: r.applicationId, organisation: r.organisation, title: r.title, date: r.date, time: r.time }));
    },
    async user(id) {
      const row = await UserModel.findById(id).select("_id email role status emailNotifications deadlineReminders interviewReminders").lean();
      return row ? { id: String(row._id), email: row.email, role: row.role, status: row.status, emailNotifications: row.emailNotifications, deadlineReminders: row.deadlineReminders, interviewReminders: row.interviewReminders } : null;
    },
    async ownsApplication(id, userId) {
      return Boolean(await ApplicationModel.exists({ _id: id, userId }));
    },
    async claim(key, now) {
      const token = randomUUID();
      const leaseUntil = new Date(now.getTime() + CLAIM_LEASE_MS);
      try {
        await ReminderLogModel.create({ key, token, state: "claimed", leaseUntil });
        return { key, token };
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
      const row = await ReminderLogModel.findOneAndUpdate(
        { key, state: "claimed", leaseUntil: { $lte: now } },
        { $set: { token, leaseUntil } }, { returnDocument: "after" }
      );
      return row ? { key, token } : null;
    },
    async current(kind, candidate) {
      if (kind === "deadline") {
        const row = await ApplicationModel.findOne({ _id: candidate.id, userId: candidate.userId }).lean();
        return row ? { id: String(row._id), userId: String(row.userId), organisation: row.organisation, title: row.roleTitle, date: row.deadline } : null;
      }
      const row = await CalendarEventModel.findOne({ _id: candidate.id, userId: candidate.userId, applicationId: candidate.applicationId, type: "interview" }).lean();
      return row ? { id: String(row._id), userId: String(row.userId), applicationId: row.applicationId, organisation: row.organisation, title: row.title, date: row.date, time: row.time } : null;
    },
    async begin({ key, token }) {
      const row = await ReminderLogModel.updateOne({ key, token, state: "claimed", leaseUntil: { $gt: new Date() } }, { $set: { state: "sending" } });
      if (row.modifiedCount !== 1) throw new Error("Reminder claim expired or was lost");
    },
    async sent({ key, token }) {
      const row = await ReminderLogModel.updateOne({ key, token, state: "sending" }, { $set: { state: "sent", sentAt: new Date() } });
      if (row.modifiedCount !== 1) throw new Error("Reminder claim was lost");
    },
    async release({ key, token }) {
      await ReminderLogModel.deleteOne({ key, token, state: { $in: ["claimed", "sending"] } });
    },
    send: sendReminderEmail,
    diagnose(reason) { console.warn("Reminder diagnostic:", reason); },
  };
  return runReminders(deps);
}

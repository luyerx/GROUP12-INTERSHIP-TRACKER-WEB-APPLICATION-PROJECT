import { authorizeRole } from "@/lib/authorization";
import { AIAssistantHistoryModel } from "@/lib/models/AIAssistantHistory";
import { UserModel } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await authorizeRole("admin");
    if (!auth.authorized) return auth.response;

    await connectToDatabase();

    const totals = await AIAssistantHistoryModel.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          lastUsedAt: { $max: "$createdAt" },
          features: { $addToSet: "$feature" },
        },
      },
      { $sort: { count: -1, lastUsedAt: -1 } },
      { $limit: 100 },
    ]);

    const userIds = totals.map((item) => item._id);
    const users = await UserModel.find({ _id: { $in: userIds } }, { fullName: 1, email: 1, role: 1 }).lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    const usage = totals.map((item) => {
      const user = userMap.get(String(item._id));
      return {
        userId: String(item._id),
        fullName: user?.fullName || "Unknown user",
        email: user?.email || "",
        role: user?.role || "student",
        totalRequests: item.count,
        lastUsedAt: item.lastUsedAt,
        features: item.features,
      };
    });

    const totalRequests = usage.reduce((sum, item) => sum + item.totalRequests, 0);
    const recent = usage.slice(0, 10);

    return Response.json({
      success: true,
      data: {
        totalUsers: usage.length,
        totalRequests,
        recent,
        usage,
      },
    });
  } catch (error) {
    console.error("AI usage aggregate error:", error);
    return Response.json({ success: false, message: "Unable to load AI usage statistics." }, { status: 500 });
  }
}

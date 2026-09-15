import { authorizeRole } from "@/lib/authorization";
import { UserModel } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  await connectToDatabase();
  const users = await UserModel.find().sort({ createdAt: -1 }).lean();
  return Response.json({
    success: true,
    data: users.map((user) => ({
      id: String(user._id),
      name: user.fullName,
      email: user.email,
      programme: user.major || user.degree || "Not specified",
      role:
        user.role === "superadmin" ? "Super Admin" : user.role === "admin"
          ? "Admin"
          : user.role === "employee"
            ? "Employee"
            : "Student",
      status: user.status || "Active",
      joined: new Date(user.createdAt).toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    })),
  });
}

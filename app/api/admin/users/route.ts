import bcrypt from "bcryptjs";
import { z } from "zod";
import { accountPasswordError, PASSWORD_HASH_ROUNDS } from "@/lib/accountPassword";
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

const createAdminSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required.").max(120),
  email: z.string().trim().toLowerCase().max(160).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."),
  password: z.string().superRefine((value, context) => {
    const message = accountPasswordError(value);
    if (message) context.addIssue({ code: "custom", message });
  }),
}).strict();

export async function POST(request: Request) {
  const authorization = await authorizeRole("superadmin");
  if (!authorization.authorized) return authorization.response;
  const input = createAdminSchema.safeParse(await request.json().catch(() => null));
  if (!input.success)
    return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });

  const duplicate = () => Response.json({ success: false, message: "An account with this email already exists." }, { status: 409 });
  try {
    await connectToDatabase();
    const { fullName, email, password } = input.data;
    if (await UserModel.exists({ email })) return duplicate();
    const user = await UserModel.create({
      fullName, email,
      passwordHash: await bcrypt.hash(password, PASSWORD_HASH_ROUNDS),
      role: "admin",
      status: "Active",
    });
    return Response.json({
      success: true,
      message: "Admin account created successfully.",
      data: {
        id: String(user._id), name: user.fullName, email: user.email,
        programme: "Not specified", role: "Admin", status: user.status,
        joined: new Date(user.createdAt).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }),
      },
    }, { status: 201 });
  } catch (error) {
    // The unique email index also covers simultaneous requests.
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000)
      return duplicate();
    return Response.json({ success: false, message: "Unable to create admin account. Please retry." }, { status: 500 });
  }
}

import { authorizeRole } from "@/lib/authorization";
import { UserModel } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

const userUpdateSchema = z.object({
  programme: z.string().trim().max(160),
  role: z.enum(["Student", "Admin", "Employee"]).optional(),
  status: z.enum(["Active", "Suspended"]),
}).strict();
const deny = (message: string, status = 403) => Response.json({ success: false, message }, { status });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
  if (!isValidObjectId(id)) return deny("Invalid user ID.", 400);
  if (id === authorization.user.id) return deny("You cannot change your own account here.", 400);
  const input = userUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return deny(input.error.issues[0].message, 400);
  const superadmin = authorization.user.role === "superadmin";
  if (input.data.role !== undefined && !superadmin) return deny("Only Super Admin can change roles.");
  await connectToDatabase();
  // Include allowed target roles in the mutation itself to protect against concurrent promotion.
  const allowedRoles = superadmin ? ["student", "employee", "admin"] : ["student", "employee"];
  const user = await UserModel.findOneAndUpdate(
    { _id: id, role: { $in: allowedRoles } },
    {
      major: input.data.programme, status: input.data.status,
      ...(input.data.role !== undefined ? { role: input.data.role.toLowerCase() } : {})
    },
    { new: true, runValidators: true },
  );
  if (!user) return deny("Account is protected or no longer available.");
  return Response.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
  if (!isValidObjectId(id)) return deny("Invalid user ID.", 400);
  if (id === authorization.user.id) return deny("You cannot delete your own account.", 400);
  await connectToDatabase();
  const allowedRoles = authorization.user.role === "superadmin" ? ["student", "employee", "admin"] : ["student", "employee"];
  const user = await UserModel.findOneAndDelete({ _id: id, role: { $in: allowedRoles } });
  if (!user) return deny("Account is protected or no longer available.");
  return Response.json({ success: true });
}

import { z } from "zod";

import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

const userUpdateSchema = z.object({
  programme: z.string().trim().max(160),
  role: z.enum(["Student", "Admin", "Employee"]),
  status: z.enum(["Active", "Suspended"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
  if (id === authorization.user.id)
    return Response.json(
      { message: "Ask another admin to change your own role or status." },
      { status: 400 },
    );
  const input = userUpdateSchema.safeParse(await request.json());
  if (!input.success)
    return Response.json(
      { success: false, message: input.error.issues[0].message },
      { status: 400 },
    );
  await connectToDatabase();
  const user = await UserModel.findByIdAndUpdate(
    id,
    {
      major: input.data.programme,
      role: input.data.role.toLowerCase(),
      status: input.data.status,
    },
    { new: true, runValidators: true },
  ).lean();
  if (!user)
    return Response.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  return Response.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
  if (id === authorization.user.id)
    return Response.json(
      { success: false, message: "You cannot delete your own account." },
      { status: 400 },
    );
  await connectToDatabase();
  const user = await UserModel.findByIdAndDelete(id);
  if (!user)
    return Response.json(
      { success: false, message: "User not found." },
      { status: 404 },
    );
  return Response.json({ success: true });
}

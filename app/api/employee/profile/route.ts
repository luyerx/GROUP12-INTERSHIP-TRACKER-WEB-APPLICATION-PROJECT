import { z } from "zod";
import { authorizeRole } from "@/lib/authorization";
import { UserModel } from "@/lib/models/User";
const schema = z.object({
  fullName: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(160),
  companyWebsite: z.union([
    z.url().refine((v) => /^https?:\/\//i.test(v)),
    z.literal(""),
  ]),
  companyDescription: z.string().trim().max(4000),
  location: z.string().trim().max(120),
});
export async function PATCH(request: Request) {
  try {
    const auth = await authorizeRole("employee");
    if (!auth.authorized) return auth.response;
    const input = schema.safeParse(await request.json());
    if (!input.success)
      return Response.json(
        { message: input.error.issues[0].message },
        { status: 400 },
      );
    await UserModel.findByIdAndUpdate(auth.user.id, input.data, {
      runValidators: true,
    });
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { message: "Unable to save profile." },
      { status: 500 },
    );
  }
}

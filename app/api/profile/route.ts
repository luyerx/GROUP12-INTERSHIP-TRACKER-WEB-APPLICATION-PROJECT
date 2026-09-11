import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";

const profileSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.email().trim().toLowerCase().max(160),
  university: z.string().trim().max(160),
  degree: z.string().trim().max(160),
  major: z.string().trim().max(160),
  graduationYear: z.string().trim().max(4),
  location: z.string().trim().max(120),
  preferredRoles: z.array(z.string().trim().min(1).max(160)).max(20),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(20),
  skills: z.array(z.string().trim().min(1).max(120)).max(50),
  openToInternships: z.boolean(),
  emailNotifications: z.boolean(),
  deadlineReminders: z.boolean(),
  interviewReminders: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const input = profileSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
    }

    await connectToDatabase();
    const duplicate = await UserModel.findOne({
      email: input.data.email,
      _id: { $ne: currentUser.id },
    });
    if (duplicate) {
      return NextResponse.json({ success: false, message: "That email address is already in use." }, { status: 409 });
    }

    const user = await UserModel.findByIdAndUpdate(
      currentUser.id,
      input.data,
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...currentUser,
        fullName: user.fullName,
        email: user.email,
        university: user.university || "",
        degree: user.degree || "",
        major: user.major || "",
        graduationYear: user.graduationYear || "",
        location: user.location || "",
        preferredRoles: user.preferredRoles || [],
        preferredLocations: user.preferredLocations || [],
        skills: user.skills || [],
        openToInternships: user.openToInternships ?? true,
        notifications: {
          email: user.emailNotifications ?? true,
          deadlineReminders: user.deadlineReminders ?? true,
          interviewReminders: user.interviewReminders ?? true,
        },
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ success: false, message: "Unable to update profile." }, { status: 500 });
  }
}
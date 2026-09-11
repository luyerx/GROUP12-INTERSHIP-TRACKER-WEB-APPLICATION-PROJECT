import { calendarEventSchema } from "@/lib/calendarEvent";
import { authorizeRole } from "@/lib/authorization";
import { createCalendarEvent, listCalendarEvents } from "@/lib/eventsRepository";

export async function GET() {
  const authorization = await authorizeRole("student");
  if (!authorization.authorized) return authorization.response;
  return Response.json({ success: true, data: await listCalendarEvents(authorization.user.id) });
}

export async function POST(request: Request) {
  const authorization = await authorizeRole("student");
  if (!authorization.authorized) return authorization.response;
  const input = calendarEventSchema.safeParse(await request.json());
  if (!input.success) return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
  const data = await createCalendarEvent(authorization.user.id, input.data);
  if (!data) return Response.json({ success: false, message: "The selected application does not belong to this user." }, { status: 400 });
  return Response.json({ success: true, data }, { status: 201 });
}
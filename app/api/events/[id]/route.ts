import { validObjectId, invalidIdResponse } from "@/lib/apiValidation";
import { readJson } from "@/lib/apiValidation";
import { calendarEventSchema } from "@/lib/calendarEvent";
import { authorizeRole } from "@/lib/authorization";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/eventsRepository";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRole("student");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
    if (!validObjectId(id)) return invalidIdResponse();
  const input = calendarEventSchema.safeParse(await readJson(request));
  if (!input.success) return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
  const data = await updateCalendarEvent(id, authorization.user.id, input.data);
  if (!data) return Response.json({ success: false, message: "The event or selected application was not found." }, { status: 404 });
  return Response.json({ success: true, data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRole("student");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
    if (!validObjectId(id)) return invalidIdResponse();
  const data = await deleteCalendarEvent(id, authorization.user.id);
  if (!data) return Response.json({ success: false, message: "Calendar event not found." }, { status: 404 });
  return Response.json({ success: true });
}
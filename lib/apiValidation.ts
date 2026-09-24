/** JSON parsing stays local to write handlers; schemas reject the null sentinel. */
export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}
export function validObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
export function invalidIdResponse() {
  return Response.json({ success: false, message: "Invalid record ID." }, { status: 400 });
}

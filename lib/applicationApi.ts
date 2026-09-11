import "server-only";

export function applicationApiError(error: unknown) {
  if (error instanceof SyntaxError) {
    return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }
  return Response.json(
    { success: false, message: "Unable to access applications. Please try again." },
    { status: 500 }
  );
}

export function applicationNotFound() {
  return Response.json({ success: false, message: "Application not found." }, { status: 404 });
}

export function GET(_req: Request) {
  return Response.json({ text: process.env.TEST });
}

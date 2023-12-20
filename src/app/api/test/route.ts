export function GET(_req: Request) {
  const test = process.env.TEST;
  console.log("test: ", test);
  return Response.json({ text: test });
}

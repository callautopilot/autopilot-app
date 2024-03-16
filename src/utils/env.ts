import z, { ZodError } from "zod";
import dotenv from "dotenv";

const envFilePath =
  process.env.NODE_ENV === "production" ? ".env" : ".env.local";
dotenv.config({ path: envFilePath });

const parsedEnvValidator = z.object({
  // Server
  NODE_ENV: z.string().default("development"),
  PORT: z.number().default(3000),

  // External services
  ELEVEN_LABS_API_KEY: z.string().trim().min(1),
  DEEPGRAM_API_KEY: z.string().trim().min(1),
  OPENAI_API_KEY: z.string().trim().min(1),
});

type ParsedEnv = z.infer<typeof parsedEnvValidator>;

let parsedEnv: ParsedEnv;

try {
  parsedEnv = parsedEnvValidator.parse(process.env);
} catch (error) {
  if (error instanceof ZodError) {
    const missingVars = error.issues
      .filter(
        (issue) =>
          issue.code === "invalid_type" &&
          issue.expected === "string" &&
          issue.received === "undefined"
      )
      .map((issue) => issue.path[0])
      .join(", ");

    console.error(`Missing environment variables: ${missingVars}`);
    process.exit(1);
  }

  throw error;
}

export const env = {
  ...parsedEnv,
  get IS_DEV() {
    return parsedEnv.NODE_ENV !== "production";
  },
};

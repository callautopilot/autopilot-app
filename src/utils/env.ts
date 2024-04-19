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
  OPENAI_API_KEY: z.string().optional().default(''),
  DEEPGRAM_API_KEY: z.string().optional().default(''),
  ELEVEN_LABS_API_KEY: z.string().optional().default(''),
  ELEVEN_LABS_VOICE_ID: z.string().optional().default(''),
});

type ParsedEnv = z.infer<typeof parsedEnvValidator>;

let parsedEnv: ParsedEnv;

try {
  parsedEnv = parsedEnvValidator.parse(process.env);
} catch (error) {
  if (error instanceof ZodError) {
    console.error(`Environment validation error: ${error.flatten()}`);
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

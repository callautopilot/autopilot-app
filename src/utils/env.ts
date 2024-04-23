import dotenv from "dotenv";

const envFilePath =
  process.env.NODE_ENV === "production" ? ".env" : ".env.local";
dotenv.config({ path: envFilePath });

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  get IS_DEV() {
    return process.env.NODE_ENV !== "production";
  },
};

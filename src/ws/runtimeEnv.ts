import { config } from 'dotenv';

config();

// Map to hold environment variables per user
const userEnvVars = new Map<string, Record<string, any>>();

export const setEnvVars = (socketId: string, newEnvVars: Record<string, any>) => {
  // Retrieve current env vars for the user or use default process.env
  const currentEnv = userEnvVars.get(socketId) || { ...process.env };
  // Merge with new environment variables
  const updatedEnv = { ...currentEnv, ...newEnvVars };
  // Store updated env vars for the user
  userEnvVars.set(socketId, updatedEnv);
};

export const getEnvVars = (socketId: string) => {
  // Return the user-specific environment variables, or default to process.env if not set
  return userEnvVars.get(socketId) || { ...process.env };
};
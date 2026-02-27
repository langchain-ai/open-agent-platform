/**
 * Types for cron job functionality in Open Agent Platform
 * These types align with the LangGraph SDK cron API
 */

/**
 * Metadata for a cron job
 * The owner field is required to track which user created the cron
 */
export interface CronMetadata {
  owner: string; // Supabase user ID
  name?: string; // User-friendly name for the cron job
  [key: string]: any; // Allow additional metadata fields
}

/**
 * Input structure for creating or updating a cron job
 */
export interface CronInput {
  schedule: string; // Cron expression (e.g., "0 9 * * *" for 9 AM daily)
  input: {
    messages: Array<{
      role: "user" | "assistant" | "system";
      content: string;
    }>;
    [key: string]: any; // Allow additional input fields
  };
  metadata?: CronMetadata;
}

/**
 * Complete cron job object as returned by the API
 */
export interface Cron {
  cron_id: string;
  assistant_id: string;
  thread_id?: string; // Optional - only present for thread-specific crons
  schedule: string;
  input: CronInput["input"];
  metadata?: CronMetadata;
  created_at?: string;
  updated_at?: string;
  next_run_at?: string;
  last_run_at?: string;
}

/**
 * Input for creating a new cron job with user-friendly fields
 */
export interface CreateCronFormData {
  name: string;
  schedule: string;
  inputMessage: string;
}

/**
 * Input for updating an existing cron job
 */
export interface UpdateCronInput {
  schedule?: string;
  input?: CronInput["input"];
  metadata?: Partial<CronMetadata>;
}

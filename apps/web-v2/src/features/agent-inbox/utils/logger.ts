/* eslint-disable no-console */
/**
 * Developer-only logger utility
 *
 * This logger only outputs messages in non-production environments.
 * It's designed to be used for debugging and development purposes.
 */

/**
 * A logger that only outputs messages in non-production environments
 */
export const logger = {
  /**
   * Log information to the console (development only)
   * @param args - Arguments to log
   */
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(...args);
    }
  },

  /**
   * Log errors to the console (development only)
   * @param args - Arguments to log
   */
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.error(...args);
    }
  },

  /**
   * Log warnings to the console (development only)
   * @param args - Arguments to log
   */
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(...args);
    }
  },

  /**
   * Log debug information to the console (development only)
   * @param args - Arguments to log
   */
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(...args);
    }
  },
};

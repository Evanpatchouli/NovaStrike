/**
 * Sleep for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  const duration = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

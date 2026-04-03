/**
 * Generates sequential codes like IMG-2026-04-000001, CLF-2026-04-000001
 */
export function generateCode(prefix: string, sequence: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequence).padStart(6, "0");
  return `${prefix}-${year}-${month}-${seq}`;
}

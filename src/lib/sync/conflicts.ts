// Conflict strategy (backend Sec 19): server version wins for conflicting
// edits; new expenses sync independently by unique id. No CRDT in V1.

export const serverWins = <T extends { updated_at?: string; updatedAt?: string }>(
  local: T,
  server: T
): T => server ?? local;

export const isNewRecordSync = (clientId: string, serverIds: Set<string>): boolean =>
  !serverIds.has(clientId);

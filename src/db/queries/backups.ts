import type { ExportData, BackupRecord } from '@/types';

// Backups are redundant with Firestore persistence. These functions are kept
// as no-ops to preserve the existing API surface while we rely on Firestore
// for durable storage.

export async function getAutoBackup(): Promise<ExportData | null> {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveAutoBackup(_data: ExportData): Promise<void> {
  // no-op: Firestore is the source of truth.
}

export async function deleteAutoBackup(): Promise<void> {
  // no-op.
}

// Re-export the BackupRecord type so consumers that reference it still compile.
export type { BackupRecord };

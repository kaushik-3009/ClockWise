import { db } from '../schema';
import type { BackupRecord, ExportData } from '@/types';

const AUTO_BACKUP_ID = 'auto';

export async function getAutoBackup(): Promise<ExportData | null> {
  const record = await db.backups.get(AUTO_BACKUP_ID);
  return record?.data ?? null;
}

export async function saveAutoBackup(data: ExportData): Promise<void> {
  const record: BackupRecord = {
    id: AUTO_BACKUP_ID,
    data,
    created_at: Date.now(),
  };
  await db.backups.put(record);
}

export async function deleteAutoBackup(): Promise<void> {
  await db.backups.delete(AUTO_BACKUP_ID);
}

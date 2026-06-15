import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useSettings } from '@/hooks/useSettings';
import { seedDatabase, clearDatabase } from '@/db/seed';
import {
  exportData,
  downloadExport,
  importData,
  downloadCSVExport,
  getAutoBackup,
  restoreFromAutoBackup,
} from '@/lib/exportImport';
import { requestNotificationPermission } from '@/lib/notifications';
import { useToastStore } from '@/components/ui/Toast';
import { playAmbient, stopAmbient } from '@/lib/ambient';
import type { TimerSettings } from '@/types';

const PRESET_COLORS = [
  '#E8521A', // Orange (default)
  '#E74C3C', // Red
  '#EC4899', // Pink
  '#9B59B6', // Purple
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#22C55E', // Green
  '#EAB308', // Yellow
];

const AMBIENT_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'rain', label: 'Rain' },
  { value: 'white', label: 'White Noise' },
  { value: 'brown', label: 'Brown Noise' },
  { value: 'cafe', label: 'Cafe' },
] as const;

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, saveSettings } = useSettings();
  const addToast = useToastStore((s) => s.addToast);
  const [form, setForm] = useState<TimerSettings>(settings);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [hasAutoBackup, setHasAutoBackup] = useState(false);
  const [dangerAction, setDangerAction] = useState<'clear' | 'seed' | null>(null);
  const [dangerConfirm, setDangerConfirm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    getAutoBackup().then((data) => setHasAutoBackup(data !== null));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDangerAction(null);
      setDangerConfirm('');
    }
  }, [open]);

  useEffect(() => {
    setForm(settings);
  }, [settings, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(form);
    if (/^#[0-9a-fA-F]{6}$/.test(form.accent_color)) {
      document.documentElement.style.setProperty('--color-brand', form.accent_color);
    }
    onClose();
  };

  const update = <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSound = () => {
    update('sound_enabled', !form.sound_enabled);
  };

  const toggleNotifications = async () => {
    if (!form.notifications_enabled) {
      const granted = await requestNotificationPermission();
      update('notifications_enabled', granted);
    } else {
      update('notifications_enabled', false);
    }
  };

  const previewAmbient = (type: TimerSettings['ambient_sound']) => {
    if (type === 'off') {
      stopAmbient();
    } else {
      playAmbient(type, form.ambient_volume);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-1"
      >
        {/* Timer Durations */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Focus (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={form.focus_minutes}
              onChange={(e) => update('focus_minutes', Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Short Break (min)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.short_break_minutes}
              onChange={(e) => update('short_break_minutes', Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Long Break (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={form.long_break_minutes}
              onChange={(e) => update('long_break_minutes', Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Phases per session</label>
            <input
              type="number"
              min={2}
              max={20}
              value={form.phases_per_session}
              onChange={(e) => update('phases_per_session', Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Weekly Goal (hours)</label>
            <input
              type="number"
              min={0}
              max={168}
              step={1}
              value={form.weekly_goal_hours}
              onChange={(e) => update('weekly_goal_hours', Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Warn Before End (sec)</label>
            <input
              type="number"
              min={0}
              max={300}
              step={5}
              value={form.warn_before_seconds}
              onChange={(e) => update('warn_before_seconds', Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Timer Style */}
        <div>
          <label className="block text-sm text-text-sub mb-2">Timer Style</label>
          <div className="flex rounded-md border border-border-base overflow-hidden">
            {(
              [
                { value: 'digital', label: 'Digital' },
                { value: 'clock_numeric', label: 'Clock + Timer' },
                { value: 'analog', label: 'Analog' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('timer_style', opt.value)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  form.timer_style === opt.value
                    ? 'bg-brand text-white'
                    : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm text-text-sub mb-2">Accent Color</label>
          <div className="flex gap-2 flex-wrap mb-2 p-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => update('accent_color', color)}
                className={`w-8 h-8 rounded-full transition-transform ${
                  form.accent_color === color
                    ? 'ring-2 ring-offset-1 ring-offset-bg-card ring-text-base'
                    : ''
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3 py-1 border-t border-border-base pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-base">Auto-start next phase</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.auto_start}
              onClick={() => update('auto_start', !form.auto_start)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-fast ${
                form.auto_start ? 'bg-brand' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-fast ${
                  form.auto_start ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-text-base">Sound effects</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.sound_enabled}
              onClick={toggleSound}
              className={`relative w-11 h-6 rounded-full transition-colors duration-fast ${
                form.sound_enabled ? 'bg-brand' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-fast ${
                  form.sound_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-text-base">Browser notifications</span>
              <span className="text-xs text-text-muted">Notify when timer completes</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.notifications_enabled}
              onClick={toggleNotifications}
              className={`relative w-11 h-6 rounded-full transition-colors duration-fast ${
                form.notifications_enabled ? 'bg-brand' : 'bg-bg-tertiary'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-fast ${
                  form.notifications_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Ambient Sound */}
        <div className="border-t border-border-base pt-4">
          <label className="block text-sm text-text-sub mb-2">Ambient Background Sound</label>
          <div className="flex rounded-md border border-border-base overflow-hidden mb-3">
            {AMBIENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  update('ambient_sound', opt.value);
                  previewAmbient(opt.value);
                }}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  form.ambient_sound === opt.value
                    ? 'bg-brand text-white'
                    : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.ambient_sound !== 'off' && (
            <div>
              <label className="block text-xs text-text-sub mb-1">Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={form.ambient_volume}
                onChange={(e) => {
                  const vol = Number(e.target.value);
                  update('ambient_volume', vol);
                  if (form.ambient_sound !== 'off') {
                    playAmbient(form.ambient_sound, vol);
                  }
                }}
                className="w-full"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold text-sm rounded-md transition-colors duration-fast mt-1"
        >
          Save Settings
        </button>

        <div className="flex gap-2 mt-2 pt-4 border-t border-border-base">
          <button
            type="button"
            onClick={async () => {
              const data = await exportData();
              downloadExport(data);
            }}
            className="flex-1 h-10 rounded-md border border-border-base text-text-sub text-xs font-medium hover:text-brand hover:border-brand transition-colors"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={async () => {
              const data = await exportData();
              downloadCSVExport(data);
            }}
            className="flex-1 h-10 rounded-md border border-border-base text-text-sub text-xs font-medium hover:text-brand hover:border-brand transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-10 rounded-md border border-border-base text-text-sub text-xs font-medium hover:text-brand hover:border-brand transition-colors"
          >
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text);
                await importData(data);
                setImportStatus('Import successful! Reloading...');
                setTimeout(() => window.location.reload(), 800);
              } catch (err) {
                setImportStatus(
                  `Import failed: ${err instanceof Error ? err.message : String(err)}`
                );
              }
              e.target.value = '';
            }}
          />
        </div>

        {importStatus && (
          <p
            className={`text-xs text-center ${importStatus.includes('failed') ? 'text-error' : 'text-success'}`}
          >
            {importStatus}
          </p>
        )}

        {hasAutoBackup && (
          <div className="pt-2 border-t border-border-base">
            <button
              type="button"
              onClick={async () => {
                try {
                  await restoreFromAutoBackup();
                  addToast('Restored from auto-backup', 'success');
                  setTimeout(() => window.location.reload(), 600);
                } catch {
                  addToast('Failed to restore backup', 'error');
                }
              }}
              className="w-full h-10 rounded-md border border-border-base text-text-sub text-sm font-medium hover:text-brand hover:border-brand transition-colors"
            >
              Restore from Auto-Backup
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-border-base">
          <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">
            Danger Zone
          </p>
          {dangerAction === null ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDangerAction('clear')}
                className="flex-1 h-10 rounded-md border border-border-base text-text-sub text-sm font-medium hover:text-error hover:border-error transition-colors"
              >
                Clear All Data
              </button>
              <button
                type="button"
                onClick={() => setDangerAction('seed')}
                className="flex-1 h-10 rounded-md border border-border-base text-text-sub text-sm font-medium hover:text-brand hover:border-brand transition-colors"
              >
                Re-seed Demo Data
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-text-sub">
                {dangerAction === 'clear'
                  ? 'This will permanently delete all projects, tasks, sessions, and settings. Type DELETE to confirm.'
                  : 'This will replace your current data with demo data. Type SEED to confirm.'}
              </p>
              <input
                type="text"
                value={dangerConfirm}
                onChange={(e) => setDangerConfirm(e.target.value)}
                placeholder={dangerAction === 'clear' ? 'DELETE' : 'SEED'}
                className="w-full h-10 px-3 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDangerAction(null);
                    setDangerConfirm('');
                  }}
                  className="flex-1 h-10 rounded-md border border-border-base text-text-sub text-sm font-medium hover:bg-bg-tertiary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    dangerAction === 'clear' ? dangerConfirm !== 'DELETE' : dangerConfirm !== 'SEED'
                  }
                  onClick={async () => {
                    try {
                      if (dangerAction === 'clear') {
                        await clearDatabase();
                      } else {
                        await clearDatabase();
                        await seedDatabase(true);
                      }
                      window.location.reload();
                    } catch (err) {
                      addToast(
                        dangerAction === 'clear' ? 'Failed to clear data' : 'Failed to seed data',
                        'error'
                      );
                    }
                  }}
                  className={
                    'flex-1 h-10 rounded-md text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ' +
                    (dangerAction === 'clear'
                      ? 'bg-error hover:bg-error-hover'
                      : 'bg-brand hover:bg-brand-hover')
                  }
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

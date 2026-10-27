import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  sendEmailVerification,
} from 'firebase/auth';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/lib/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUiStore, type ThemePreference } from '@/stores/uiStore';
import { clearUserData, deleteAllUserData, seedUserDemoData } from '@/db/seed';
import {
  exportData,
  downloadExport,
  downloadCSVExport,
  importData,
  MAX_IMPORT_BYTES,
} from '@/lib/exportImport';
import { notificationsSupported, requestNotificationPermission } from '@/lib/notifications';
import { buildPhaseSequence } from '@/lib/phases';
import { formatDuration } from '@/lib/time';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/cn';
import type { TimerSettings } from '@/types';

const PRESET_COLORS = [
  { value: '#E8521A', name: 'Orange' },
  { value: '#E74C3C', name: 'Red' },
  { value: '#EC4899', name: 'Pink' },
  { value: '#9B59B6', name: 'Purple' },
  { value: '#3B82F6', name: 'Blue' },
  { value: '#14B8A6', name: 'Teal' },
  { value: '#22C55E', name: 'Green' },
  { value: '#EAB308', name: 'Yellow' },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-base bg-bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold text-text-base">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-text-sub">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** Number field that keeps a draft while typing and commits a clamped value on blur. */
function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === '' || !Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, step === 1 ? Math.round(n) : n));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-text-sub">{label}</span>
      <span className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="field pr-12"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm text-text-base">{label}</span>
        {hint && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
      <Switch label={label} checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: typeof Sun }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-text-sub" id={`seg-${label}`}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`seg-${label}`}
        className="flex overflow-hidden rounded-md border border-border-input"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex min-h-11 flex-1 items-center justify-center gap-1.5 px-2 text-sm font-medium transition-colors',
                selected
                  ? 'bg-brand-solid text-white'
                  : 'text-text-sub hover:bg-bg-secondary hover:text-text-base'
              )}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsPage() {
  usePageTitle('Settings');
  const navigate = useNavigate();
  const { user, logOut, resetPassword } = useAuth();
  const { settings, saveSettings } = useSettings();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [danger, setDanger] = useState<'clear' | 'seed' | 'delete' | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');

  const save = (partial: Partial<TimerSettings>) => saveSettings(partial);

  const plan = buildPhaseSequence(settings);
  const planSeconds = plan.reduce((sum, p) => sum + p.duration_minutes * 60, 0);
  const focusCount = plan.filter((p) => p.type === 'focus').length;

  const toggleNotifications = async (on: boolean) => {
    if (!on) return save({ notifications_enabled: false });
    const granted = await requestNotificationPermission();
    if (!granted) {
      toast.error(
        notificationsSupported()
          ? 'Notifications are blocked. Allow them in your browser or system settings.'
          : 'This browser doesn’t support notifications. On iPhone, add ClockWise to your Home Screen first.'
      );
    }
    save({ notifications_enabled: granted });
  };

  const runExport = async (kind: 'json' | 'csv') => {
    if (!user) return;
    setBusy(kind);
    try {
      const data = await exportData(user.uid);
      if (kind === 'json') downloadExport(data);
      else downloadCSVExport(data);
    } catch {
      toast.error('Export failed. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const runImport = async (file: File) => {
    if (!user) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error('That file is too large to be a ClockWise export.');
      return;
    }
    setBusy('import');
    try {
      const raw = JSON.parse(await file.text());
      const summary = await importData(user.uid, raw);
      const skipped = summary.skipped ? ` (${summary.skipped} invalid records skipped)` : '';
      toast.success(
        `Imported ${summary.projects} projects, ${summary.tasks} tasks and ${summary.sessions} sessions${skipped}.`
      );
    } catch (err) {
      toast.error(
        err instanceof SyntaxError
          ? 'That file isn’t valid JSON.'
          : `Import failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setBusy(null);
    }
  };

  const closeDanger = () => {
    setDanger(null);
    setConfirmText('');
    setPassword('');
  };

  const runDanger = async () => {
    if (!user || !danger) return;
    setBusy(danger);
    try {
      if (danger === 'clear') {
        await clearUserData(user.uid);
        toast.success('All your data was deleted.');
      } else if (danger === 'seed') {
        await seedUserDemoData(user.uid);
        toast.success('Demo data loaded.');
      } else {
        if (!user.email) throw new Error('Missing email');
        await reauthenticateWithCredential(
          user,
          EmailAuthProvider.credential(user.email, password)
        );
        await deleteAllUserData(user.uid);
        await deleteUser(user);
        await logOut();
        navigate('/', { replace: true });
        return;
      }
      closeDanger();
    } catch (err) {
      const code = (err as { code?: string }).code;
      toast.error(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'That password is incorrect.'
          : 'Something went wrong. Check your connection and try again.'
      );
    } finally {
      setBusy(null);
    }
  };

  const confirmWord = danger === 'seed' ? 'DEMO' : 'DELETE';
  const canConfirm =
    confirmText.trim().toUpperCase() === confirmWord &&
    (danger !== 'delete' || password.length > 0);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-6 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-semibold text-text-base">Settings</h1>

      <Section
        title="Timer"
        description={`One session: ${focusCount} focus phases, about ${formatDuration(planSeconds)} in total. Changes apply from the next session.`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="Focus"
            suffix="min"
            min={1}
            max={180}
            value={settings.focus_minutes}
            onCommit={(v) => save({ focus_minutes: v })}
          />
          <NumberField
            label="Short break"
            suffix="min"
            min={1}
            max={60}
            value={settings.short_break_minutes}
            onCommit={(v) => save({ short_break_minutes: v })}
          />
          <NumberField
            label="Long break"
            suffix="min"
            min={1}
            max={120}
            value={settings.long_break_minutes}
            onCommit={(v) => save({ long_break_minutes: v })}
          />
          <NumberField
            label="Phases per session"
            min={1}
            max={24}
            value={settings.phases_per_session}
            onCommit={(v) => save({ phases_per_session: v })}
          />
          <NumberField
            label="Long break after every"
            suffix="focus"
            min={1}
            max={12}
            value={settings.long_break_after_n}
            onCommit={(v) => save({ long_break_after_n: v })}
          />
          <NumberField
            label="Warn before the end"
            suffix="sec"
            min={0}
            max={600}
            step={5}
            value={settings.warn_before_seconds}
            onCommit={(v) => save({ warn_before_seconds: v })}
          />
        </div>
        <ToggleRow
          label="Start the next phase automatically"
          checked={settings.auto_start}
          onChange={(v) => save({ auto_start: v })}
        />
      </Section>

      <Section title="Goals">
        <NumberField
          label="Weekly focus goal"
          suffix="hours"
          min={0}
          max={168}
          value={settings.weekly_goal_hours}
          onCommit={(v) => save({ weekly_goal_hours: v })}
        />
      </Section>

      <Section title="Appearance">
        <Segmented<ThemePreference>
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: 'System', icon: Monitor },
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ]}
        />
        <Segmented<TimerSettings['timer_style']>
          label="Timer style"
          value={settings.timer_style}
          onChange={(v) => save({ timer_style: v })}
          options={[
            { value: 'digital', label: 'Digital' },
            { value: 'analog', label: 'Dial' },
            { value: 'clock_numeric', label: 'Clock' },
          ]}
        />
        <fieldset>
          <legend className="mb-2 text-sm text-text-sub">Accent colour</legend>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => {
              const selected = settings.accent_color.toLowerCase() === color.value.toLowerCase();
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => save({ accent_color: color.value })}
                  aria-pressed={selected}
                  aria-label={color.name}
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <span
                    className={cn(
                      'h-8 w-8 rounded-full',
                      selected && 'ring-2 ring-text-base ring-offset-2 ring-offset-bg-card'
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      </Section>

      <Section title="Sound & alerts">
        <ToggleRow
          label="Sound effects"
          checked={settings.sound_enabled}
          onChange={(v) => save({ sound_enabled: v })}
        />
        <ToggleRow
          label="Notifications"
          hint="Alert you when a phase ends while ClockWise is in the background. On iPhone this needs the Home Screen app."
          checked={settings.notifications_enabled}
          onChange={toggleNotifications}
        />
        <ToggleRow
          label="Keep the screen on while the timer runs"
          hint="Stops your phone locking (and pausing the app) mid-focus."
          checked={settings.keep_screen_awake}
          onChange={(v) => save({ keep_screen_awake: v })}
        />
        <ToggleRow
          label="Keyboard shortcuts"
          hint="Space, R and S on the timer page."
          checked={settings.keyboard_shortcuts}
          onChange={(v) => save({ keyboard_shortcuts: v })}
        />
      </Section>

      <Section
        title="Your data"
        description="Download a copy of everything, or restore from a backup."
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy !== null}
            onClick={() => runExport('json')}
          >
            {busy === 'json' ? 'Exporting…' : 'Export backup (JSON)'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy !== null}
            onClick={() => runExport('csv')}
          >
            {busy === 'csv' ? 'Exporting…' : 'Export sessions (CSV)'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy !== null}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy === 'import' ? 'Importing…' : 'Import backup'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void runImport(file);
          }}
        />
        <div className="flex flex-col gap-2 border-t border-border-base pt-4 sm:flex-row">
          <button type="button" className="btn-secondary flex-1" onClick={() => setDanger('seed')}>
            Load demo data
          </button>
          <button type="button" className="btn-danger flex-1" onClick={() => setDanger('clear')}>
            Delete all data
          </button>
        </div>
      </Section>

      <Section title="Account" description={user?.email ?? undefined}>
        {user && !user.emailVerified && (
          <div className="flex flex-col gap-2 rounded-md bg-bg-secondary p-3 text-sm text-text-sub sm:flex-row sm:items-center sm:justify-between">
            <span>Your email address isn’t verified yet.</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                sendEmailVerification(user)
                  .then(() => toast.success('Verification email sent.'))
                  .catch(() => toast.error('Couldn’t send the email. Try again later.'))
              }
            >
              Send verification email
            </button>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() =>
              user?.email &&
              resetPassword(user.email)
                .then(() => toast.success(`Password reset link sent to ${user.email}.`))
                .catch(() => toast.error('Couldn’t send the email. Try again later.'))
            }
          >
            Change password
          </button>
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={async () => {
              await logOut();
              navigate('/', { replace: true });
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
        <button type="button" className="btn-danger" onClick={() => setDanger('delete')}>
          Delete account
        </button>
      </Section>

      <Modal
        open={danger !== null}
        onClose={closeDanger}
        title={
          danger === 'delete'
            ? 'Delete your account?'
            : danger === 'clear'
              ? 'Delete all data?'
              : 'Load demo data?'
        }
        className="max-w-[440px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canConfirm) void runDanger();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-text-sub">
            {danger === 'delete'
              ? 'This permanently deletes your account and every project, task and session. It cannot be undone.'
              : danger === 'clear'
                ? 'This permanently deletes all projects, tasks, sessions and settings. Your templates are kept.'
                : 'This replaces everything in your account with 90 days of sample data. Your current data will be deleted.'}{' '}
            Type <strong className="text-text-base">{confirmWord}</strong> to confirm.
          </p>
          <input
            type="text"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label={`Type ${confirmWord} to confirm`}
            className="field"
          />
          {danger === 'delete' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-text-sub">Your password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
              />
            </label>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" className="btn-secondary flex-1" onClick={closeDanger}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canConfirm || busy !== null}
              className={cn('flex-1', danger === 'seed' ? 'btn-primary' : 'btn-danger-solid')}
            >
              {busy ? 'Working…' : danger === 'seed' ? 'Load demo data' : 'Delete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

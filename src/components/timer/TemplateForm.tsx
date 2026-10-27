import { useState, useEffect, useId } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MAX_NAME_LENGTH } from '@/lib/constants';
import { sessionLengthSeconds } from '@/lib/phases';
import { formatDuration } from '@/lib/time';
import type { TimerTemplate } from '@/types';

type TemplateData = Omit<TimerTemplate, 'id' | 'created_at' | 'user_id'>;

interface TemplateFormProps {
  open: boolean;
  template?: TimerTemplate | null;
  onClose: () => void;
  onSave: (data: TemplateData) => void;
}

const FIELDS = [
  { key: 'focus_minutes', label: 'Focus', suffix: 'min', min: 1, max: 180 },
  { key: 'short_break_minutes', label: 'Short break', suffix: 'min', min: 1, max: 60 },
  { key: 'long_break_minutes', label: 'Long break', suffix: 'min', min: 1, max: 120 },
  { key: 'phases_per_session', label: 'Phases per session', suffix: '', min: 1, max: 24 },
  { key: 'long_break_after_n', label: 'Long break after every', suffix: 'focus', min: 1, max: 12 },
] as const;

type NumKey = (typeof FIELDS)[number]['key'];
const DEFAULTS: Record<NumKey, number> = {
  focus_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
  phases_per_session: 8,
  long_break_after_n: 4,
};

export function TemplateForm({ open, template, onClose, onSave }: TemplateFormProps) {
  const ids = useId();
  const [name, setName] = useState('');
  const [values, setValues] = useState<Record<NumKey, string>>(
    () =>
      Object.fromEntries(FIELDS.map((f) => [f.key, String(DEFAULTS[f.key])])) as Record<
        NumKey,
        string
      >
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? '');
    setValues(
      Object.fromEntries(
        FIELDS.map((f) => [f.key, String(template ? template[f.key] : DEFAULTS[f.key])])
      ) as Record<NumKey, string>
    );
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Whole numbers inside each field's range; anything else is invalid.
  const parsed = Object.fromEntries(
    FIELDS.map((f) => {
      const n = Number(values[f.key]);
      const ok = values[f.key].trim() !== '' && Number.isInteger(n) && n >= f.min && n <= f.max;
      return [f.key, ok ? n : null];
    })
  ) as Record<NumKey, number | null>;
  const invalid = FIELDS.filter((f) => parsed[f.key] === null);
  const preview =
    invalid.length === 0 ? sessionLengthSeconds(parsed as Record<NumKey, number>) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give the template a name.');
    if (invalid.length)
      return setError(`Check ${invalid.map((f) => f.label.toLowerCase()).join(', ')}.`);
    onSave({ name: name.trim().slice(0, MAX_NAME_LENGTH), ...(parsed as Record<NumKey, number>) });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Edit template' : 'New template'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${ids}-name`} className="text-sm text-text-sub">
            Name
          </label>
          <input
            id={`${ids}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Study session"
            maxLength={MAX_NAME_LENGTH}
            className="field"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label
              key={f.key}
              className={
                f.key === 'long_break_after_n'
                  ? 'col-span-2 flex flex-col gap-1.5'
                  : 'flex flex-col gap-1.5'
              }
            >
              <span className="text-sm text-text-sub">{f.label}</span>
              <span className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  step={1}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  aria-invalid={parsed[f.key] === null}
                  className="field pr-14 aria-[invalid=true]:border-error"
                />
                {f.suffix && (
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">
                    {f.suffix}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>

        <p className="text-sm text-text-sub" aria-live="polite">
          {preview !== null
            ? `One session lasts ${formatDuration(preview)}.`
            : 'Use whole numbers within each field’s range.'}
        </p>
        {error && <p className="text-sm text-error-text">{error}</p>}

        <button type="submit" className="btn-primary h-12 w-full">
          {template ? 'Save changes' : 'Create template'}
        </button>
      </form>
    </Modal>
  );
}

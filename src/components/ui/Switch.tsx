import { cn } from '@/lib/cn';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** Accessible on/off switch with a 44px touch target. */
export function Switch({ label, checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-14 shrink-0 items-center justify-center disabled:opacity-50"
    >
      <span
        className={cn(
          'relative h-7 w-12 rounded-full transition-colors duration-fast',
          checked ? 'bg-brand-solid' : 'bg-border-input'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-fast',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  );
}

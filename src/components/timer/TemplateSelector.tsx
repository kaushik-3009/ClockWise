import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useSettings } from '@/hooks/useSettings';
import { useTimerStore, isFreshSession } from '@/stores/timerStore';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { matchesTemplate } from '@/lib/phases';
import type { TimerTemplate } from '@/types';

interface TemplateSelectorProps {
  className?: string;
}

export function TemplateSelector({ className }: TemplateSelectorProps) {
  const { templates } = useTemplates();
  const { settings, saveSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (templates.length === 0) return null;

  const activeTemplate = templates.find((t) => matchesTemplate(t, settings));

  const handleSelect = (template: TimerTemplate) => {
    const midSession = !isFreshSession(useTimerStore.getState());
    saveSettings({
      focus_minutes: template.focus_minutes,
      short_break_minutes: template.short_break_minutes,
      long_break_minutes: template.long_break_minutes,
      phases_per_session: template.phases_per_session,
      long_break_after_n: template.long_break_after_n,
    });
    if (midSession) toast.info(`"${template.name}" will apply from your next session.`);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex h-10 max-w-[70vw] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
          activeTemplate
            ? 'border-brand bg-brand-alpha text-brand-text'
            : 'border-border-base bg-bg-card text-text-sub hover:text-text-base'
        )}
      >
        <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{activeTemplate ? activeTemplate.name : 'Custom timer'}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-40 mt-1.5 w-64 -translate-x-1/2 rounded-lg border border-border-base bg-bg-card py-1 text-left shadow-elevated">
          <ul role="listbox" aria-label="Timer templates">
            {templates.map((template) => {
              const selected = activeTemplate?.id === template.id;
              return (
                <li key={template.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(template)}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm transition-colors',
                      selected
                        ? 'bg-brand-alpha text-brand-text'
                        : 'text-text-sub hover:bg-bg-secondary hover:text-text-base'
                    )}
                  >
                    <Check
                      className={cn('h-4 w-4 shrink-0', !selected && 'invisible')}
                      aria-hidden="true"
                    />
                    <span className="truncate">{template.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-text-muted">
                      {template.focus_minutes}/{template.short_break_minutes} min
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 border-t border-border-base pt-1">
            <Link
              to="/templates"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center px-3 text-sm text-text-sub transition-colors hover:bg-bg-secondary hover:text-brand-text"
            >
              Manage templates →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

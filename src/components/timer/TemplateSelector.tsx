import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/cn';
import type { TimerTemplate } from '@/types';

interface TemplateSelectorProps {
  className?: string;
}

export function TemplateSelector({ className }: TemplateSelectorProps) {
  const navigate = useNavigate();
  const { templates } = useTemplates();
  const { settings, saveSettings } = useSettings();
  const [open, setOpen] = useState(false);

  if (templates.length === 0) return null;

  const activeTemplate = templates.find(
    (t) =>
      Math.abs(t.focus_minutes - settings.focus_minutes) <= 2 &&
      Math.abs(t.short_break_minutes - settings.short_break_minutes) <= 2 &&
      Math.abs(t.long_break_minutes - settings.long_break_minutes) <= 2 &&
      t.phases_per_session === settings.phases_per_session &&
      t.long_break_after_n === settings.long_break_after_n
  );

  const handleSelect = (template: TimerTemplate) => {
    saveSettings({
      focus_minutes: template.focus_minutes,
      short_break_minutes: template.short_break_minutes,
      long_break_minutes: template.long_break_minutes,
      phases_per_session: template.phases_per_session,
      long_break_after_n: template.long_break_after_n,
    });
    setOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs font-medium transition-colors',
          activeTemplate
            ? 'border-brand bg-brand-alpha text-brand'
            : 'border-border-base bg-bg-card text-text-sub hover:text-text-base'
        )}
      >
        <Layers className="w-3.5 h-3.5" />
        {activeTemplate ? activeTemplate.name : 'Templates'}
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-56 bg-bg-card border border-border-base rounded-lg shadow-lg z-40 py-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  activeTemplate?.id === template.id
                    ? 'text-brand bg-brand-alpha'
                    : 'text-text-sub hover:text-text-base hover:bg-bg-secondary'
                )}
              >
                {activeTemplate?.id === template.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{template.name}</span>
                <span className="ml-auto text-[10px] text-text-muted shrink-0">
                  {template.focus_minutes}m
                </span>
              </button>
            ))}
            <div className="border-t border-border-base mt-1 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate('/templates');
                }}
                className="block w-full text-left px-3 py-2 text-sm text-text-sub hover:text-brand hover:bg-bg-secondary transition-colors"
              >
                Manage templates →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

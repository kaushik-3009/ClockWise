import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { MAX_NAME_LENGTH } from '@/lib/constants';
import type { TimerTemplate } from '@/types';

interface TemplateFormProps {
  open: boolean;
  template?: TimerTemplate | null;
  onClose: () => void;
  onSave: (data: Omit<TimerTemplate, 'id' | 'created_at'>) => void;
}

export function TemplateForm({ open, template, onClose, onSave }: TemplateFormProps) {
  const [name, setName] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [phasesPerSession, setPhasesPerSession] = useState(8);
  const [longBreakAfterN, setLongBreakAfterN] = useState(4);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setFocusMinutes(template.focus_minutes);
      setShortBreakMinutes(template.short_break_minutes);
      setLongBreakMinutes(template.long_break_minutes);
      setPhasesPerSession(template.phases_per_session);
      setLongBreakAfterN(template.long_break_after_n);
    } else {
      setName('');
      setFocusMinutes(25);
      setShortBreakMinutes(5);
      setLongBreakMinutes(15);
      setPhasesPerSession(8);
      setLongBreakAfterN(4);
    }
  }, [template, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      focus_minutes: Math.max(1, Math.min(120, focusMinutes)),
      short_break_minutes: Math.max(1, Math.min(60, shortBreakMinutes)),
      long_break_minutes: Math.max(1, Math.min(120, longBreakMinutes)),
      phases_per_session: Math.max(2, Math.min(20, phasesPerSession)),
      long_break_after_n: Math.max(1, Math.min(phasesPerSession, longBreakAfterN)),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Edit Template' : 'Create Template'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-text-sub mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Study Session"
            maxLength={MAX_NAME_LENGTH}
            className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Focus (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Short Break (min)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={shortBreakMinutes}
              onChange={(e) => setShortBreakMinutes(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Long Break (min)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={longBreakMinutes}
              onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-text-sub mb-1.5">Phases</label>
            <input
              type="number"
              min={2}
              max={20}
              value={phasesPerSession}
              onChange={(e) => setPhasesPerSession(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-sub mb-1.5">
            Long break after every N focus phases
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={longBreakAfterN}
            onChange={(e) => setLongBreakAfterN(Number(e.target.value))}
            className="w-full h-11 px-3.5 rounded-md border border-border-base bg-bg-secondary text-text-base text-sm outline-none focus:border-brand transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-brand hover:bg-brand-hover text-white font-semibold text-sm rounded-md transition-colors duration-fast"
        >
          {template ? 'Save Changes' : 'Create Template'}
        </button>
      </form>
    </Modal>
  );
}

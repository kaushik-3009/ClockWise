import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Check, Layers } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useSettings } from '@/hooks/useSettings';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useTimerStore, isFreshSession } from '@/stores/timerStore';
import { TemplateForm } from '@/components/timer/TemplateForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { matchesTemplate, sessionLengthSeconds } from '@/lib/phases';
import { formatDuration } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { TimerTemplate } from '@/types';

const iconBtn =
  'flex h-11 w-11 items-center justify-center rounded-full text-text-sub transition-colors';

export function TemplatesPage() {
  usePageTitle('Templates');
  const navigate = useNavigate();
  const { templates, addTemplate, editTemplate, removeTemplate } = useTemplates();
  const { settings, saveSettings } = useSettings();

  const [editing, setEditing] = useState<TimerTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TimerTemplate | null>(null);

  // Several templates can share the same values; mark only the first as in use.
  const activeId = templates.find((t) => matchesTemplate(t, settings))?.id;

  const handleApply = (template: TimerTemplate) => {
    const midSession = !isFreshSession(useTimerStore.getState());
    saveSettings({
      focus_minutes: template.focus_minutes,
      short_break_minutes: template.short_break_minutes,
      long_break_minutes: template.long_break_minutes,
      phases_per_session: template.phases_per_session,
      long_break_after_n: template.long_break_after_n,
    });
    toast.success(
      midSession
        ? `"${template.name}" will apply from your next session.`
        : `Using "${template.name}".`
    );
    navigate('/timer');
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:p-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-base">Templates</h1>
          <p className="text-sm text-text-sub">Saved timer setups you can switch between.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="mb-4 h-12 w-12 text-text-muted" aria-hidden="true" />
          <p className="mb-1 text-lg font-medium text-text-base">No templates yet</p>
          <p className="mb-5 text-sm text-text-sub">Save setups for different kinds of work.</p>
          <button type="button" onClick={openCreate} className="btn-secondary">
            Create your first template
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((template) => {
            const active = template.id === activeId;
            return (
              <li
                key={template.id}
                className={cn(
                  'flex flex-col rounded-lg border bg-bg-card p-5 transition-colors',
                  active ? 'border-brand' : 'border-border-base'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="min-w-0 break-words pt-2 font-semibold text-text-base">
                    {template.name}
                    {active && (
                      <span className="ml-2 rounded bg-brand-alpha px-1.5 py-0.5 align-middle text-xs font-semibold text-brand-text">
                        In use
                      </span>
                    )}
                  </h2>
                  <div className="-mr-2 -mt-1 flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(template);
                        setShowForm(true);
                      }}
                      className={cn(iconBtn, 'hover:bg-bg-secondary hover:text-text-base')}
                      aria-label={`Edit ${template.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(template)}
                      className={cn(iconBtn, 'hover:bg-error-light hover:text-error-text')}
                      aria-label={`Delete ${template.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {[
                    ['Focus', `${template.focus_minutes} min`],
                    ['Short break', `${template.short_break_minutes} min`],
                    ['Long break', `${template.long_break_minutes} min`],
                    ['Phases', String(template.phases_per_session)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt className="text-text-sub">{k}</dt>
                      <dd className="font-medium text-text-base">{v}</dd>
                    </div>
                  ))}
                  <div className="col-span-2 text-text-sub">
                    Long break after every {template.long_break_after_n} focus{' '}
                    {template.long_break_after_n === 1 ? 'phase' : 'phases'}
                  </div>
                </dl>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="text-xs text-text-sub">
                    {formatDuration(sessionLengthSeconds(template))} per session
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApply(template)}
                    disabled={active}
                    className="btn-secondary"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {active ? 'In use' : 'Use this'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TemplateForm
        open={showForm}
        template={editing}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSave={(data) => {
          if (editing) {
            editTemplate(editing.id, data);
            toast.success('Template updated.');
          } else {
            addTemplate(data);
            toast.success('Template created.');
          }
        }}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            removeTemplate(confirmDelete.id);
            toast.success('Template deleted.');
          }
        }}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        description="Your current timer settings won’t change."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

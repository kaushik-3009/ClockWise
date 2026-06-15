import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Check, Clock, Layers } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { useSettings } from '@/hooks/useSettings';
import { TemplateForm } from '@/components/timer/TemplateForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToastStore } from '@/components/ui/Toast';
import type { TimerTemplate } from '@/types';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { templates, addTemplate, editTemplate, removeTemplate } = useTemplates();
  const { saveSettings } = useSettings();
  const addToast = useToastStore((s) => s.addToast);

  const [editingTemplate, setEditingTemplate] = useState<TimerTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TimerTemplate | null>(null);

  const handleApply = (template: TimerTemplate) => {
    saveSettings({
      focus_minutes: template.focus_minutes,
      short_break_minutes: template.short_break_minutes,
      long_break_minutes: template.long_break_minutes,
      phases_per_session: template.phases_per_session,
      long_break_after_n: template.long_break_after_n,
    });
    addToast(`Applied "${template.name}" template`, 'success');
    navigate('/timer');
  };

  const handleSave = (data: Omit<TimerTemplate, 'id' | 'created_at'>) => {
    if (editingTemplate) {
      editTemplate(editingTemplate.id, data);
      addToast('Template updated', 'success');
    } else {
      addTemplate(data);
      addToast('Template created', 'success');
    }
    setEditingTemplate(null);
    setShowForm(false);
  };

  const totalDuration = (t: TimerTemplate) => {
    const focusCount = Math.ceil(t.phases_per_session / 2);
    const shortBreaks = Math.max(0, focusCount - Math.floor(focusCount / t.long_break_after_n) - 1);
    const longBreaks = Math.floor(focusCount / t.long_break_after_n);
    const totalMins =
      focusCount * t.focus_minutes +
      shortBreaks * t.short_break_minutes +
      longBreaks * t.long_break_minutes;
    return totalMins;
  };

  return (
    <div className="p-6 lg:p-12 w-full 2xl:max-w-[1600px] 2xl:mx-auto animate-[page-enter_200ms_ease]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-base">Timer Templates</h1>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Layers className="w-12 h-12 mb-4 opacity-80" />
          <p className="text-lg font-medium mb-2">No templates yet</p>
          <p className="text-sm mb-6">Create presets for different work modes</p>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowForm(true);
            }}
            className="h-9 px-4 rounded-md border border-border-base text-text-sub text-sm font-medium hover:text-brand hover:border-brand transition-colors"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-bg-card border border-border-base rounded-lg p-5 hover:border-brand/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-text-base">{template.name}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTemplate(template);
                      setShowForm(true);
                    }}
                    className="p-1.5 rounded text-text-sub hover:text-brand hover:bg-brand-alpha transition-colors"
                    aria-label="Edit template"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(template)}
                    className="p-1.5 rounded text-text-sub hover:text-error hover:bg-error/10 transition-colors"
                    aria-label="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-4">
                <div className="flex items-center gap-2 text-text-sub">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{template.focus_minutes}m focus</span>
                </div>
                <div className="text-text-sub">{template.phases_per_session} phases</div>
                <div className="text-text-sub">{template.short_break_minutes}m short break</div>
                <div className="text-text-sub">{template.long_break_minutes}m long break</div>
                <div className="text-text-sub col-span-2">
                  Long break every {template.long_break_after_n} focus phases
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  ~{totalDuration(template)}m per session
                </span>
                <button
                  onClick={() => handleApply(template)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-brand-alpha text-brand text-xs font-medium hover:bg-brand hover:text-white transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TemplateForm
        open={showForm}
        template={editingTemplate}
        onClose={() => {
          setShowForm(false);
          setEditingTemplate(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            removeTemplate(confirmDelete.id);
            addToast('Template deleted', 'success');
          }
          setConfirmDelete(null);
        }}
        title="Delete Template"
        description={`Are you sure you want to delete "${confirmDelete?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

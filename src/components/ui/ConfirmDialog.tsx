import { cn } from '@/lib/cn';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} className="max-w-[420px]">
      <p className="mb-6 text-sm text-text-sub">{description}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          className="h-11 flex-1 rounded-md border border-border-input text-sm font-medium text-text-sub transition-colors hover:bg-bg-tertiary"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'h-11 flex-1 rounded-md text-sm font-semibold text-white transition-colors hover:opacity-90',
            variant === 'danger' ? 'bg-error-solid' : 'bg-brand-solid'
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

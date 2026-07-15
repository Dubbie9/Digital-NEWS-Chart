import { useEffect, type ReactNode } from 'react';

interface Props {
  onClose: () => void;
  /** id of the element that titles the dialog */
  labelledBy: string;
  /** Tailwind max-width class for the panel */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * Shared modal overlay: bottom sheet on phones, centred card on larger
 * screens. Deliberately no backdrop-blur — full-screen backdrop-filter is
 * one of the most expensive effects on mobile Safari and caused visible
 * stutter when opening modals on iPads.
 */
export default function ModalShell({ onClose, labelledBy, maxWidth = 'max-w-lg', children }: Props) {
  useEffect(() => {
    // Lock background scroll while the modal is open (scroll-behind on iOS
    // makes the page judder under the sheet)
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`mx-0 w-full ${maxWidth} overflow-hidden rounded-t-2xl border border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:mx-4 sm:rounded-2xl sm:pb-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

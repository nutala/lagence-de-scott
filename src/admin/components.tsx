import React, { ReactNode } from 'react';
import { X, Inbox } from 'lucide-react';
import { STATUT_COLORS } from './types';

export function Modal({
  title,
  onClose,
  children,
  wide = false,
  closeOnOverlayClick = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  closeOnOverlayClick?: boolean;
}) {
  return (
    <div className="modal-overlay" onClick={closeOnOverlayClick ? onClose : undefined}>
      <div
        className="modal"
        style={wide ? { maxWidth: 760 } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ statut }: { statut: string }) {
  return <span className={`badge ${STATUT_COLORS[statut] || 'badge-muted'}`}>{statut}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="loading-page">
      <div className="spinner" />
      {label}
    </div>
  );
}

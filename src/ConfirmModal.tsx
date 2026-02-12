type ConfirmModalProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title = "Conferma",
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modal-actions">
          <button className="modal-cancel" onClick={onCancel}>
            Annulla
          </button>
          <button className="modal-confirm" onClick={onConfirm}>
            Elimina
          </button>
        </div>
      </div>
    </div>
  );
}

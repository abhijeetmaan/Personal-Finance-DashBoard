import Modal from "./Modal";

function ConfirmDialog({
  isOpen = false,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={description}
      onConfirm={onConfirm}
      confirmText={confirmLabel}
      cancelText={cancelLabel}
      variant={tone === "danger" ? "danger" : "primary"}
    />
  );
}

export default ConfirmDialog;

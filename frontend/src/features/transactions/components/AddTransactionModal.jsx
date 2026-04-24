import AddTransactionForm from "./AddTransactionForm";
import FormModal from "../../../components/ui/FormModal";
import { useToast } from "../../../components/ui/ToastProvider";
import { transactionService } from "../services/transactionService";

function AddTransactionModal({ isOpen, onClose }) {
  const { showToast } = useToast();

  const handleSubmit = async (payload) => {
    try {
      await transactionService.createTransaction(payload);
      showToast("Transaction added", "success");
      onClose?.();
      return true;
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Failed to add transaction.",
        "error",
      );
      return false;
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="New transaction"
      description="Log income or spending—updates your dashboard and ledger instantly."
    >
      <div className="-m-2">
        <AddTransactionForm
          title=""
          submitLabel="Save transaction"
          onCancel={onClose}
          onSubmit={handleSubmit}
          compact
        />
      </div>
    </FormModal>
  );
}

export default AddTransactionModal;

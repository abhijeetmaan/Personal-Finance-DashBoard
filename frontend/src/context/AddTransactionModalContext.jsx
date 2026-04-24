import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import AddTransactionModal from "../features/transactions/components/AddTransactionModal";

const AddTransactionModalContext = createContext(null);

export function AddTransactionModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openAddTransaction = useCallback(() => setIsOpen(true), []);
  const closeAddTransaction = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ openAddTransaction, closeAddTransaction, isOpen }),
    [openAddTransaction, closeAddTransaction, isOpen],
  );

  return (
    <AddTransactionModalContext.Provider value={value}>
      {children}
      <AddTransactionModal isOpen={isOpen} onClose={closeAddTransaction} />
    </AddTransactionModalContext.Provider>
  );
}

export function useAddTransactionModal() {
  const ctx = useContext(AddTransactionModalContext);
  if (!ctx) {
    throw new Error(
      "useAddTransactionModal must be used within AddTransactionModalProvider",
    );
  }
  return ctx;
}

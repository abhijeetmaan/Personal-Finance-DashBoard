import { useCallback, useEffect, useState } from "react";
import { accountsService } from "../features/accounts/services/accountsService";
import {
  applySavedOrder,
  pruneOrderIds,
  readOrderIds,
  writeOrderIds,
  PFD_ACCOUNT_ORDER_KEY,
} from "../utils/persistedOrder";

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshAccounts = useCallback(async (options = {}) => {
    setIsLoading(true);

    try {
      const items = await accountsService.getAccounts(options);
      const nextAccounts = Array.isArray(items) ? items : [];
      const sorted = [...nextAccounts].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      const ordered = applySavedOrder(
        sorted,
        readOrderIds(PFD_ACCOUNT_ORDER_KEY),
      );
      setAccounts(ordered);
      return ordered;
    } catch {
      setAccounts([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const addAccount = useCallback(async (payload) => {
    const created = await accountsService.createAccount(payload);
    setAccounts((current) => {
      const next = [...current, created];
      writeOrderIds(
        PFD_ACCOUNT_ORDER_KEY,
        next.map((a) => a._id),
      );
      return next;
    });
    return created;
  }, []);

  const deleteAccount = useCallback(async (id, options = {}) => {
    const updated = await accountsService.deleteAccount(id, options);
    setAccounts((current) => {
      const next = current.filter((item) => item._id !== id);
      pruneOrderIds(
        PFD_ACCOUNT_ORDER_KEY,
        next.map((item) => item._id),
      );
      return next;
    });
    return updated;
  }, []);

  const reorderAccounts = useCallback((newOrder) => {
    writeOrderIds(
      PFD_ACCOUNT_ORDER_KEY,
      newOrder.map((a) => a._id),
    );
    setAccounts(newOrder);
  }, []);

  return {
    accounts,
    isLoading,
    refreshAccounts,
    addAccount,
    deleteAccount,
    reorderAccounts,
  };
}

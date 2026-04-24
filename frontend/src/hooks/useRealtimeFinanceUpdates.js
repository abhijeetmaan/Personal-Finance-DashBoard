import { useEffect, useState } from "react";
import createFinanceSocket from "../services/socketClient";

export function useRealtimeFinanceUpdates({
  onTransactionEvent,
  onBudgetEvent,
} = {}) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = createFinanceSocket();

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      if (import.meta.env.DEV) {
        console.error("[socket] connect_error", err?.message || err);
      }
    });

    socket.on("transactionAdded", (payload) => {
      onTransactionEvent?.("transactionAdded", payload);
    });

    socket.on("transactionUpdated", (payload) => {
      onTransactionEvent?.("transactionUpdated", payload);
    });

    socket.on("transactionDeleted", (payload) => {
      onTransactionEvent?.("transactionDeleted", payload);
    });

    socket.on("budgetUpdated", (payload) => {
      onBudgetEvent?.(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [onBudgetEvent, onTransactionEvent]);

  return isConnected;
}

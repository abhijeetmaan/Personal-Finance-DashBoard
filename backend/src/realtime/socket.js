import { Server } from "socket.io";
import { env } from "../config/env.js";

export let io = null;

export const initSocket = (httpServer) => {
  if (io) return io;

  const socketCors =
    env.corsOrigins === "*"
      ? { origin: "*", credentials: false }
      : {
          origin: env.corsOrigins,
          credentials: env.corsCredentials,
        };

  io = new Server(httpServer, {
    cors: {
      ...socketCors,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  });

  io.on("connection", (socket) => {
    socket.emit("connected", {
      status: "ok",
      message: "Realtime channel connected",
    });
  });

  return io;
};

const emitEvent = (eventName, payload) => {
  if (!io) return;
  io.emit(eventName, payload);
};

export const emitTransactionAdded = (transaction) => {
  emitEvent("transactionAdded", transaction);
};

export const emitTransactionUpdated = (transaction) => {
  emitEvent("transactionUpdated", transaction);
};

export const emitTransactionDeleted = (payload) => {
  emitEvent("transactionDeleted", payload);
};

export const emitBudgetUpdated = (budget) => {
  emitEvent("budgetUpdated", budget);
};

import { Server } from "socket.io";
import { env } from "../config/env.js";
import { createCorsOptions } from "../config/cors.js";

export let io = null;

const socketCorsOptions = createCorsOptions({
  allowedOrigins: env.corsAllowedOrigins,
  allowVercelSubdomains: env.corsAllowVercelSubdomains,
});

export const initSocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: socketCorsOptions.origin,
      credentials: socketCorsOptions.credentials,
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

import { Server } from "socket.io";

export let io = null;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://personal-finance-dash-board.vercel.app",
].filter(Boolean);

export const initSocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS blocked: " + origin));
      },
      credentials: true,
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


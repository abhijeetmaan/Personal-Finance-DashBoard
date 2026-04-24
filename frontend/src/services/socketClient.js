import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api.js";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL?.trim() || API_BASE_URL;

export const createFinanceSocket = () =>
  io(socketUrl, {
    transports: ["websocket", "polling"],
  });

export default createFinanceSocket;

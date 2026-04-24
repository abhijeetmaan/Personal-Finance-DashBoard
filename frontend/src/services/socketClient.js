import { io } from "socket.io-client";
import { getBackendOrigin } from "../config/api.js";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL?.trim() || getBackendOrigin();

export const createFinanceSocket = () =>
  io(socketUrl, {
    transports: ["websocket", "polling"],
  });

export default createFinanceSocket;

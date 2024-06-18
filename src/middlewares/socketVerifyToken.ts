import { Server, Socket } from "socket.io";
import { verifyJwtToken } from "../utils/jwt";
import { User } from "../utils/socket";
import { JwtPayload } from "jsonwebtoken";

export const socketVerifyToken = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.token;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    const { exp, iat, ...rest } = verifyJwtToken(token) as User & JwtPayload;
    (socket as any).user = { ...rest };
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
};

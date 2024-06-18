import express from "express";
import { PrismaClient } from "@prisma/client";
import userRouter from "./modules/user/routes";
import {
  notFoundHandler,
  validationHandler,
  errorHandler,
} from "./middlewares";
import { Server } from "socket.io";
import { socketVerifyToken } from "./middlewares/socketVerifyToken";
import cors from "cors";
import { socketConnection } from "./utils/socket";
import http from "http";
import cookieParser from 'cookie-parser';

const PORT = process.env.PORT || 8000;
const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);


app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/users", userRouter);

app.use(validationHandler);
app.use(notFoundHandler);
app.use(errorHandler);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.use(socketVerifyToken);
io.on("connection", socketConnection);

server.listen(PORT, async () => {
  await prisma.$connect();
  console.log(`Server is running on port ${PORT}`);
});

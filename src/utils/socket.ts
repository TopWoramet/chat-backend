import { Socket } from "socket.io";
import {
  createMessage,
  getHistory,
  getUserIds,
  markMessagesAsRead,
} from "../modules/message/services";
import { io } from "..";
import { getUsersWithMessageHistory } from "../modules/user/services";

export interface User {
  email: string;
  userId: string;
  username: string;
}

interface SocketUser extends Socket {
  user?: User;
}
interface PrivateMessage {
  to: string;
  receiverId: string;
  content: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  fromSelf: boolean;
}

const onlineUsers: (User & { id: string })[] = [];

export const socketConnection = (socket: SocketUser) => {
  handleUserConnection(socket);
  handleUserDisconnection(socket);
  handlePrivateMessage(socket);
  handleMessagesHistorical(socket);
  handleMessagesRead(socket);
};

const handleUserConnection = async (socket: SocketUser) => {
  console.log(`User ${socket.user?.email} connected`);

  onlineUsers.push({
    id: socket.id,
    ...socket.user!,
  });
  io.emit("onlineUsers", onlineUsers);
  const historyUsers = await getUsersWithMessageHistory(socket.user!.userId!);
  socket.emit("historyUsers", historyUsers);
};

const handleUserDisconnection = (socket: SocketUser) => {
  socket.on("disconnect", () => {
    console.log(`User ${socket.user?.email} disconnected`);
    const indexToRemove = onlineUsers.findIndex(
      (user) => user.id === socket.id
    );
    if (indexToRemove !== -1) {
      onlineUsers.splice(indexToRemove, 1);
    }

    io.emit("onlineUsers", onlineUsers);
  });
};

const handlePrivateMessage = (socket: SocketUser) => {
  socket.on(
    "privateMessage",
    async (
      msg: PrivateMessage,
      callback: (response: { id: string; timestamp: Date }) => void
    ) => {
      const message = await createMessage({
        ...msg,
        senderId: socket.user!.userId!,
      });

      callback({ id: message.id, timestamp: message.timestamp });

      const messageToDestination: Message & { from: string } = {
        id: message.id,
        timestamp: message.timestamp,
        content: msg.content,
        fromSelf: false,
        from: socket.user!.email!,
      };
      const user = onlineUsers.find(
        (user) => user.userId === message.receiverId
      );
      io.to(user?.id!).emit("privateMessage", messageToDestination);
      const historyUsers = await getUsersWithMessageHistory(user?.userId!);
      io.to(user?.id!).emit("historyUsers", historyUsers);
    }
  );
};

const handleMessagesHistorical = (socket: SocketUser) => {
  socket.on(
    "messagesHistorical",
    async (
      userId: string,
      page: number,
      pageSize: number,
      callback: (response: {
        messages: Message[];
        nextPage: number | null;
      }) => void
    ) => {
      const history = await getHistory(
        socket.user!.userId!,
        userId,
        page,
        pageSize
      );

      const messages = history.messages.map((message) => ({
        ...message,
        fromSelf: socket.user?.userId === message.senderId,
      }));
      callback({ messages, nextPage: history.nextPage });
    }
  );
};

const handleMessagesRead = async (socket: SocketUser) => {
  socket.on("messagesRead", async (messageIds: string[]) => {
    if (messageIds.length) {
      await markMessagesAsRead(messageIds);
      const message = await getUserIds(messageIds[0]);
      const user = onlineUsers.find(
        (user) => user.userId === message?.senderId
      );
      io.to([socket.id!, user?.id!]).emit("messagesRead", {
        messageIds,
        readTime: new Date(),
        from: user?.email,
      });

      const historyUsers = await getUsersWithMessageHistory(
        socket.user!.userId!
      );
      socket.emit("historyUsers", historyUsers);
    }
  });
};

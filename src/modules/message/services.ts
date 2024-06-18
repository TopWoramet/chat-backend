import { Message, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export const createMessage = async (
  data: Omit<Message, "id" | "timestamp" | "readTime">
) => {
  const message = await prisma.message.create({ data });
  return message;
};

export const getHistory = async (
  receiverId: string,
  senderId: string,
  page: number = 1,
  pageSize: number = 100
) => {
  const skip = (page - 1) * pageSize;
  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      select: {
        id: true,
        readTime: true,
        timestamp: true,
        content: true,
        senderId: true,
      },
      where: {
        OR: [
          {
            AND: [{ senderId: senderId }, { receiverId: receiverId }],
          },
          {
            AND: [{ senderId: receiverId }, { receiverId: senderId }],
          },
        ],
      },
      orderBy: {
        timestamp: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.message.count({
      where: {
        OR: [
          {
            AND: [{ senderId: senderId }, { receiverId: receiverId }],
          },
          {
            AND: [{ senderId: receiverId }, { receiverId: senderId }],
          },
        ],
      },
    }),
  ]);

  const nextPage = (page * pageSize < totalCount) ? page + 1 : null;
  return {
    messages: messages.reverse(),
    nextPage,
  };
};

export const markMessagesAsRead = async (messageIds: string[]) => {
  const updatedMessage = await prisma.message.updateMany({
    where: { id: { in: messageIds } },
    data: { readTime: new Date() },
  });
  return updatedMessage;
};

export const getUserIds = async (messageId: string) => {
  const message = await prisma.message.findFirst({
    where: { id: messageId },
    select: { receiverId: true, senderId: true },
  });
  return message;
};

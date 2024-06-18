import { PrismaClient, User } from "@prisma/client";
import { Register, Login } from "./validation";
import { hashPassword, verifyPassword } from "../../utils/password";
import { generateToken } from "../../utils/jwt";
import { UnauthorizedError } from "../../utils/error";

const prisma = new PrismaClient();

export const register = async (data: Register) => {
  const { repeat_password, password, ...rest } = data;
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { ...rest, password: hashedPassword },
    select: { id: true, email: true, username: true },
  });
  return user;
};

export const login = async ({ identifier, password }: Login) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid email/username or password");
  }

  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email/username or password");
  }

  const { password: _, ...userWithoutSensitiveFields } = user;
  const token = generateToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });
  return { user: userWithoutSensitiveFields, token };
};

export const getAll = async () => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true },
  });
  return { users };
};

export const getUsersWithMessageHistory = async (userId: string) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      sentMessages: {
        where: { receiverId: userId },
        select: { timestamp: true },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
      receivedMessages: {
        where: { senderId: userId },
        select: { timestamp: true },
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
    where: {
      OR: [
        { sentMessages: { some: { receiverId: userId } } },
        { receivedMessages: { some: { senderId: userId } } },
      ],
    },
  });

  const usersWithUnreadCounts = await Promise.all(
    users.map(async (user) => {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: user.id,
          receiverId: userId,
          readTime: null,
        },
      });

      const latestSentTimestamp =
        user.sentMessages[0]?.timestamp ?? new Date(0);
      const latestReceivedTimestamp =
        user.receivedMessages[0]?.timestamp ?? new Date(0);
      const latestTimestamp =
        latestSentTimestamp > latestReceivedTimestamp
          ? latestSentTimestamp
          : latestReceivedTimestamp;

      return {
        ...user,
        sentMessages:undefined,
        receivedMessages:undefined,
        userId: user.id,
        unreadCount,
        latestTimestamp,
      };
    })
  );

  return usersWithUnreadCounts;
};

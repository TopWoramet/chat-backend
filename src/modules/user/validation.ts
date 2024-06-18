import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(8).max(30),
    email: z.string().email(),
    password: z.string().min(8).max(30),
    repeat_password: z.string().min(8).max(30),
  })
  .refine((data) => data.password === data.repeat_password, {
    message: "Passwords don't match",
    path: ["repeat_password"],
  });

export const loginSchema = z.object({
  identifier: z.string(),
  password: z.string().min(8).max(30),
});

export type Register = z.infer<typeof registerSchema>;
export type Login = z.infer<typeof loginSchema>;

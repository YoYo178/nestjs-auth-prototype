import { User } from "src/generated/prisma/client";

export type SafeUser = Omit<User, 'passwordHash'>;
export type NewUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
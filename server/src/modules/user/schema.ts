import { Type, type Static } from "@sinclair/typebox";

export const SignupBody = Type.Object({
  userName: Type.String({ minLength: 1, maxLength: 64 }),
  userEmail: Type.String({ format: "email", maxLength: 64 }),
  password: Type.String({ minLength: 8, maxLength: 72 }),
});

export const LoginBody = Type.Object({
  userEmail: Type.String({ format: "email" }),
  password: Type.String({ minLength: 1 }),
});

export type SignupBody = Static<typeof SignupBody>;
export type LoginBody = Static<typeof LoginBody>;

// Basic auth resolver, just accepts a username and returns a JWT

import 'reflect-metadata';
import {
  Arg,
  Ctx,
  Field,
  ID,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ExpressContext } from 'apollo-server-express';
import { AuthenticationError } from 'apollo-server-core';
import { nanoid } from 'nanoid';
import { Context } from '../context';

dotenv.config();

console.log('AuthResolver.ts');

const JWT_SECRET = process.env.JWT_SECRET || '';
if (JWT_SECRET === '') {
  throw new Error(`JWT_SECRET not present in .env`);
}
const JWT_TIMEOUT = process.env.JWT_TIMEOUT || '';
if (JWT_TIMEOUT === '') {
  throw new Error('JWT_TIMEOUT not present in .env');
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;
}

@Resolver()
export default class AuthResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() ctx: Context): User | null {
    console.log(`me()`);
    return ctx.me;
  }

  @Mutation()
  register(
    @Ctx() ctx: Context,
    @Arg('username', () => String) username: string,
  ): string {
    console.log(`register(${username})`);
    const payload: User = {
      username,
      id: nanoid(),
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TIMEOUT });
  }

  @Mutation()
  refresh(@Ctx() ctx: Context): string {
    if (ctx.me === null) {
      throw new AuthenticationError(
        `You must be logged in to refresh your token`,
      );
    }
    console.log(`refresh(${ctx.me.username})`);
    const payload: User = ctx.me;
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TIMEOUT });
  }
}

export type UserContext = {
  me: User | null;
};

export const userContext = (args: ExpressContext): UserContext => {
  const token = args.req.headers.authorization;
  if (token && token !== 'null') {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (typeof decoded === 'string') {
        throw new Error(`token decoded got a string not object: ${decoded}`);
      } else {
        const { username, id } = decoded;
        if (typeof username !== 'string' || typeof id !== 'string') {
          throw new Error(
            `Decoded username or id is not a string, got ${typeof username} ${typeof id}`,
          );
        }
        const user: User = { username, id };
        return { me: user };
      }
    } catch (e) {
      // console.error(`JWT decode error`, e);
      return { me: null };
    }
  }

  return { me: null };
};

import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { SafeUser } from "../types/user.types";

export const GetUser = createParamDecorator(
    (_: any, ctx: ExecutionContext): SafeUser | null => {
        const req = ctx.switchToHttp().getRequest<Request>();
        return req?.user ?? null;
    }
)
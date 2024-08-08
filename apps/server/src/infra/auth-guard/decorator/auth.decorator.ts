import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { extractJwtFromHeader } from '@shared/common';
import { Request } from 'express';
import { ICurrentUser, isICurrentUser } from '../interface/user';

/**
 * Requires the user to be authenticated.
 * @requires Authenticated
 */
/**
 * Returns the current authenticated user.
 * @requires Authenticated
 */
export const CurrentUser = createParamDecorator<never, never, ICurrentUser>((_, ctx: ExecutionContext) => {
	const expressRequest = ctx.switchToHttp().getRequest<Request>();
	const requestUser = expressRequest.user;

	if (!requestUser || !isICurrentUser(requestUser)) {
		throw new UnauthorizedException(
			'CurrentUser missing in request context. This route requires jwt authentication guard enabled.'
		);
	}

	return requestUser;
});

/**
 * Returns the current JWT.
 * @requires Authenticated
 */
export const JWT = createParamDecorator<never, never, string>((_, ctx: ExecutionContext) => {
	const req: Request = ctx.switchToHttp().getRequest();
	const jwt = extractJwtFromHeader(req) || req.headers.authorization;

	if (!jwt) {
		throw new UnauthorizedException('Authentication is required.');
	}

	return jwt;
});

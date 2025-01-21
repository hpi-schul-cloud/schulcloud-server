import {
	applyDecorators,
	createParamDecorator,
	ExecutionContext,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { extractJwtFromHeader } from '@shared/common/utils';
import { Request } from 'express';
import { JwtAuthGuard } from '../guard';
import { ICurrentUser } from '../interface';
import { isCurrentUser } from '../mapper';

/**
 * Authentication Decorator taking care of require authentication header to be present, setting up the user context and extending openAPI spec.
 */
export const JwtAuthentication = () => {
	const decorators = [
		// apply jwt authentication
		UseGuards(JwtAuthGuard),
		// add jwt authentication to openapi spec
		ApiBearerAuth(),
	];

	return applyDecorators(...decorators);
};

/**
 * Returns the current authenticated user.
 * @requires Authenticated
 */
export const CurrentUser = createParamDecorator<never, never, ICurrentUser>((_, ctx: ExecutionContext) => {
	const expressRequest = ctx.switchToHttp().getRequest<Request>();
	const requestUser = expressRequest.user;

	if (!requestUser || !isCurrentUser(requestUser)) {
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

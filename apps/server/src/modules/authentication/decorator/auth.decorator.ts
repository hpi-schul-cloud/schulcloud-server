import {
	applyDecorators,
	createParamDecorator,
	ExecutionContext,
	ForbiddenException,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ExtractJwt } from 'passport-jwt';
import { ICurrentUser } from '../interface/user';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { JwtExtractor } from '../strategy/jwt-extractor';

const STRATEGIES = ['jwt'] as const;
type Strategies = typeof STRATEGIES;

/**
 * Authentication Decorator taking care of require authentication header to be present, setting up the user context and extending openAPI spec.
 * @param strategies accepted strategies
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const Authenticate = (...strategies: Strategies) => {
	if (strategies.includes('jwt')) {
		const decorators = [
			// apply jwt authentication
			UseGuards(JwtAuthGuard),
			// add jwt authentication to openapi spec
			ApiBearerAuth(),
		];
		return applyDecorators(...decorators);
	}
	throw new ForbiddenException('jwt strategy required');
};

/**
 * Returns the current authenticated user.
 * @requires Authenticated
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CurrentUser = createParamDecorator<any, any, ICurrentUser>((data: unknown, ctx: ExecutionContext) => {
	const { user }: Request = ctx.switchToHttp().getRequest();
	if (!user)
		throw new UnauthorizedException(
			'CurrentUser missing in request context. This route requires jwt authentication guard enabled.'
		);
	return user as ICurrentUser;
});

/**
 * Returns the current JWT.
 * @requires Authenticated
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const JWT = createParamDecorator<any, any, string>((data: unknown, ctx: ExecutionContext) => {
	const getJWT = ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), JwtExtractor.fromCookie('jwt')]);
	const req: Request = ctx.switchToHttp().getRequest();
	const jwt = getJWT(req) || req.headers.authorization;

	if (!jwt) {
		throw new UnauthorizedException('Authentication is required.');
	}

	return jwt;
});

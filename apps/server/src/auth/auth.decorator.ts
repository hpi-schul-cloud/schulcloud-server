import {
	applyDecorators,
	createParamDecorator,
	ExecutionContext,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './interfaces/jwt-payload';

/**
 * Authentication Decorator taking care of require authentication header to be present, setting up the user context and extending openAPI spec.
 * @param strategy accepted strategies
 * @returns
 */
export function Authenticate(...strategies: ['jwt']) {
	// if (strategies.includes('jwt'))
	return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}

/**
 * Returns the current authenticated user.
 * @requires Authenticated
 */
export const CurrentUser = createParamDecorator<any, any, JwtPayload>((data: unknown, ctx: ExecutionContext) => {
	const { user } = ctx.switchToHttp().getRequest();
	if (!user)
		throw new UnauthorizedException(
			'CurrentUser missing in request context. This route requires jwt authentication guard enabled.'
		);
	return user as JwtPayload;
});

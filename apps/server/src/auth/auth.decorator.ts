import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from '@nestjs/common';
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
export const User = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): JwtPayload => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	}
);

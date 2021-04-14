import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth-jwt.guard';

/**
 * Authentication Decorator taking care of authentication and extending openAPI spec.
 * @param strategy accepted strategies
 * @returns
 */
export function Authenticate(...strategies: ['jwt']) {
	// if (strategies.includes('jwt'))
	return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
}

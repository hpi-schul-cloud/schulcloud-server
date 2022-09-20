import { RoleName } from '@shared/domain/index';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { REQUIRED_ROLES, RoleGuard } from '../guard/role.guard';

/**
 * Checks if the user has at least one of the required roles.
 *
 * Has to be defined above the {@link Authenticate} decorator.
 */
export const RequireRole = (...roles: RoleName[]) => {
	const decorators = [
		// apply role authorization
		SetMetadata(REQUIRED_ROLES, roles),
		UseGuards(RoleGuard),
	];
	return applyDecorators(...decorators);
};

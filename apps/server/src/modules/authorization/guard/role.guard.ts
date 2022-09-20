import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { ICurrentUser, IRole, RoleName } from '@shared/domain/index';
import { Request } from 'express';

export const REQUIRED_ROLES = 'requiredRoles';

@Injectable()
export class RoleGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles: RoleName[] = this.reflector.getAllAndOverride<RoleName[]>(REQUIRED_ROLES, [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requiredRoles || requiredRoles.length <= 0) {
			return true;
		}

		const { user }: Request = context.switchToHttp().getRequest();
		if (!user) {
			throw new UnauthorizedException(
				'CurrentUser missing in request context. This route requires jwt authentication guard enabled.'
			);
		}
		return (user as ICurrentUser).user.roles.some((role: IRole): boolean =>
			requiredRoles.includes(role.name as RoleName)
		);
	}
}

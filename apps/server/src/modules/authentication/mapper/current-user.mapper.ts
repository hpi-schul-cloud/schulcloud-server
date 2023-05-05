import { ValidationError } from '@shared/common';
import { Role, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { ICurrentUser } from '../interface';
import { JwtPayload } from '../interface/jwt-payload';

export class CurrentUserMapper {
	static userToICurrentUser(accountId: string, user: User, systemId?: string): ICurrentUser {
		return {
			accountId,
			systemId,
			roles: user.roles.getItems().map((role: Role) => role.id),
			schoolId: user.school.id,
			userId: user.id,
		};
	}

	static userDoToICurrentUser(accountId: string, user: UserDO, systemId?: string): ICurrentUser {
		if (!user.id) {
			throw new ValidationError('user has no ID');
		}

		return {
			accountId,
			systemId,
			roles: user.roleIds,
			schoolId: user.schoolId,
			userId: user.id,
		};
	}

	static jwtToICurrentUser(jwtPayload: JwtPayload): ICurrentUser {
		return {
			accountId: jwtPayload.accountId,
			systemId: jwtPayload.systemId,
			roles: jwtPayload.roles,
			schoolId: jwtPayload.schoolId,
			userId: jwtPayload.userId,
			impersonated: jwtPayload.support,
		};
	}
}

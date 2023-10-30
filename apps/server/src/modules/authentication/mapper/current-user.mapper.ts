import { ValidationError } from '@shared/common/error/validation.error';
import { RoleReference } from '@shared/domain/domainobject/role-reference';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Role } from '@shared/domain/entity/role.entity';
import { User } from '@shared/domain/entity/user.entity';
import { JwtPayload } from 'jsonwebtoken';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { ICurrentUser, OauthCurrentUser } from '../interface/user';

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

	static mapToOauthCurrentUser(
		accountId: string,
		user: UserDO,
		systemId?: string,
		externalIdToken?: string
	): OauthCurrentUser {
		if (!user.id) {
			throw new ValidationError('user has no ID');
		}

		return {
			accountId,
			systemId,
			roles: user.roles.map((roleRef: RoleReference) => roleRef.id),
			schoolId: user.schoolId,
			userId: user.id,
			externalIdToken,
		};
	}

	static mapCurrentUserToCreateJwtPayload(currentUser: ICurrentUser): CreateJwtPayload {
		return {
			accountId: currentUser.accountId,
			userId: currentUser.userId,
			schoolId: currentUser.schoolId,
			roles: currentUser.roles,
			systemId: currentUser.systemId,
			support: currentUser.impersonated,
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

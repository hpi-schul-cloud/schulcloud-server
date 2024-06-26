import { ValidationError } from '@shared/common';
import { RoleReference } from '@shared/domain/domainobject';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Role, User } from '@shared/domain/entity';
import { ICurrentUser, OauthCurrentUser } from '../interface';
import { CreateJwtPayload, JwtPayload } from '../interface/jwt-payload';

export class CurrentUserMapper {
	static userToICurrentUser(accountId: string, user: User, isExternalUser: boolean, systemId?: string): ICurrentUser {
		return {
			accountId,
			systemId,
			roles: user.roles.getItems().map((role: Role) => role.id),
			schoolId: user.school.id,
			userId: user.id,
			isExternalUser,
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
			isExternalUser: true,
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
			isExternalUser: currentUser.isExternalUser,
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
			isExternalUser: jwtPayload.isExternalUser,
		};
	}
}

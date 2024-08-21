import { ICurrentUser } from '@infra/auth-guard';
import { ValidationError } from '@shared/common';
import { RoleReference } from '@shared/domain/domainobject';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Role, User } from '@shared/domain/entity';
import { OauthCurrentUser } from '../interface';

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
}

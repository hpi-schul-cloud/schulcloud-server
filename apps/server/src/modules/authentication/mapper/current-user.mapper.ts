import { CurrentUserFactory, ICurrentUser } from '@infra/auth-guard';
import { ValidationError } from '@shared/common';
import { RoleReference } from '@shared/domain/domainobject';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { Role, User } from '@shared/domain/entity';

// Need to be checked with CurrentUserMapper in infa/auth-guard. Should be a factory with 3 methods, build, buildFromJwt, buildfromOauth that only return CurrentUser and not OauthCurrentUser
export class CurrentUserMapper {
	static userToICurrentUser(accountId: string, user: User, isExternalUser: boolean, systemId?: string): ICurrentUser {
		const roles = user.roles.getItems().map((role: Role) => role.id);
		const currentUser = CurrentUserFactory.build(
			{
				accountId,
				systemId,
				schoolId: user.school.id,
				userId: user.id,
			},
			roles,
			isExternalUser
		);

		return currentUser;
	}

	static mapToOauthCurrentUser(
		accountId: string,
		user: UserDO,
		systemId?: string,
		externalIdToken?: string
	): ICurrentUser {
		if (!user.id) {
			throw new ValidationError('user has no ID');
		}

		const roles = user.roles.map((roleRef: RoleReference) => roleRef.id);
		const currentUser = CurrentUserFactory.buildWithExternalToken(
			{
				accountId,
				systemId,
				schoolId: user.schoolId,
				userId: user.id,
			},
			roles,
			externalIdToken
		);

		return currentUser;
	}
}

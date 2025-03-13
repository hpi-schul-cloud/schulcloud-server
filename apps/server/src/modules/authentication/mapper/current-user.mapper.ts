import { CurrentUserBuilder, ICurrentUser } from '@infra/auth-guard';
import { Role } from '@modules/role/repo';
import { UserDo } from '@modules/user';
import { User } from '@modules/user/repo';
import { ValidationError } from '@shared/common/error';
import { RoleReference } from '@shared/domain/domainobject';

export class CurrentUserMapper {
	static userToICurrentUser(accountId: string, user: User, isExternalUser: boolean, systemId?: string): ICurrentUser {
		const roles = user.roles.getItems().map((role: Role) => role.id);
		const currentUser = new CurrentUserBuilder({
			accountId,
			userId: user.id,
			schoolId: user.school.id,
			roles,
		})
			.asExternalUser(isExternalUser)
			.withExternalSystem(systemId)
			.build();

		return currentUser;
	}

	static mapToOauthCurrentUser(
		accountId: string,
		user: UserDo,
		systemId?: string,
		externalIdToken?: string
	): ICurrentUser {
		if (!user.id) {
			throw new ValidationError('user has no ID');
		}

		const roles = user.roles.map((roleRef: RoleReference) => roleRef.id);
		const currentUserBuilder = new CurrentUserBuilder({
			accountId,
			userId: user.id,
			schoolId: user.schoolId,
			roles,
		}).withExternalSystem(systemId);

		if (externalIdToken) {
			currentUserBuilder.asExternalUserWithToken(externalIdToken);
		}

		const currentUser = currentUserBuilder.build();

		return currentUser;
	}
}

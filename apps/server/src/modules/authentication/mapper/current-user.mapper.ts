import { CurrentUserBuilder, ICurrentUser } from '@infra/auth-guard';
import { Account } from '@modules/account/domain/do/account';
import { UserDo } from '@modules/user';
import { ValidationError } from '@shared/common/error';
import { RoleReference } from '@shared/domain/domainobject';

export class CurrentUserMapper {
	private static extractRoleIds(user: { roles?: { id?: string }[] | { getItems?: () => { id: string }[] } }): string[] {
		let roles: string[] = [];

		if (Array.isArray(user.roles)) {
			roles = user.roles
				.map((role) => (typeof role === 'object' && role && 'id' in role ? role.id : undefined))
				.filter(Boolean) as string[];
		} else if (
			user.roles &&
			typeof user.roles === 'object' &&
			'getItems' in user.roles &&
			typeof (user.roles as { getItems: unknown }).getItems === 'function'
		) {
			roles = (user.roles as { getItems: () => { id: string }[] }).getItems().map((role) => role.id);
		} else {
			return roles;
		}
		return roles;
	}

	public static userToICurrentUser(
		accountId: string,
		user: {
			id?: string;
			school?: { id?: string };
			roles?: { id?: string }[] | { getItems?: () => { id: string }[] };
		},
		isExternalUser: boolean,
		systemId?: string
	): ICurrentUser {
		const roles = this.extractRoleIds(user);
		const schoolId = user.school?.id;
		const currentUser = new CurrentUserBuilder({
			accountId,
			userId: user.id as string,
			schoolId: schoolId as string,
			roles,
		})
			.asExternalUser(isExternalUser)
			.withExternalSystem(systemId)
			.build();
		return currentUser;
	}

	public static mapToOauthCurrentUser(
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

	public static mapToErwinCurrentUser(
		account: Account,
		user: {
			id?: string;
			schoolId?: string;
			school?: { id?: string };
			roles?: { id?: string }[] | { getItems?: () => { id: string }[] };
			externalId?: string;
		},
		systemId?: string,
		isExternalUser?: boolean
	): ICurrentUser {
		const roles = this.extractRoleIds(user);
		const schoolId = user.schoolId || user.school?.id;
		const accountId = account.id;

		const external = isExternalUser ?? false;

		if (systemId == account.systemId) {
			// SVS systemId exists, keep it and return
			return new CurrentUserBuilder({
				accountId,
				userId: user.id as string,
				schoolId: schoolId as string,
				roles,
			})
				.asExternalUser(external)
				.withExternalSystem(systemId)
				.build();
		} else {
			if (user.externalId) {
				// No SVS systemId, but UserDo.ExternalId exists: use Erwin systemId (assume passed as param)
				return new CurrentUserBuilder({
					accountId,
					userId: user.id as string,
					schoolId: schoolId as string,
					roles,
				})
					.asExternalUser(true)
					.withExternalSystem(systemId)
					.build();
			} else {
				// No SVS systemId, no UserDo.ExternalId: empty systemId, set isExternalUser to false
				return new CurrentUserBuilder({
					accountId,
					userId: user.id as string,
					schoolId: schoolId as string,
					roles,
				})
					.asExternalUser(false)
					.withExternalSystem(undefined)
					.build();
			}
		}
	}
}

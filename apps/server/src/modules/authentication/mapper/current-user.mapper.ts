import { CurrentUserBuilder, ICurrentUser } from '@infra/auth-guard';
import type { Account } from '@modules/account';
import { UserDo } from '@modules/user';
import { ValidationError } from '@shared/common/error';

export class CurrentUserMapper {
	private static extractRoleIds(roles?: { id?: string }[]): string[] {
		if (!roles) return [];
		return roles
			.filter(
				(role): role is { id: string } => typeof role === 'object' && role !== null && typeof role.id === 'string'
			)
			.map((role) => role.id);
	}

	private static handleExternalUser(
		accountId: string,
		userId: string,
		schoolId: string,
		roles: string[],
		externalId?: string,
		systemId?: string
	): ICurrentUser {
		if (externalId) {
			// No SVS systemId, but UserDo.ExternalId exists: use Erwin systemId (assume passed as param)
			return new CurrentUserBuilder({
				accountId,
				userId,
				schoolId,
				roles,
			})
				.asExternalUser(true)
				.withExternalSystem(systemId)
				.build();
		} else {
			// No SVS systemId, no UserDo.ExternalId: empty systemId, set isExternalUser to false
			return new CurrentUserBuilder({
				accountId,
				userId,
				schoolId,
				roles,
			})
				.asExternalUser(false)
				.withExternalSystem(undefined)
				.build();
		}
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
		if (!user.id) {
			throw new ValidationError('user has no ID');
		}

		const schoolId = user.school?.id;
		if (!schoolId) {
			throw new ValidationError('user has no school ID');
		}

		let rolesArray: { id?: string }[] | undefined;
		if (user.roles && 'getItems' in user.roles && typeof user.roles.getItems === 'function') {
			rolesArray = user.roles.getItems();
		} else {
			rolesArray = user.roles as { id?: string }[] | undefined;
		}

		const currentUser = new CurrentUserBuilder({
			accountId,
			userId: user.id,
			schoolId,
			roles: this.extractRoleIds(rolesArray),
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

		const currentUserBuilder = new CurrentUserBuilder({
			accountId,
			userId: user.id,
			schoolId: user.schoolId,
			roles: this.extractRoleIds(user.roles),
		}).withExternalSystem(systemId);

		if (externalIdToken) {
			currentUserBuilder.asExternalUserWithToken(externalIdToken);
		}

		const currentUser = currentUserBuilder.build();

		return currentUser;
	}

	public static mapToErwinCurrentUser(
		account: Account,
		user: UserDo,
		systemId?: string,
		isExternalUser?: boolean
	): ICurrentUser {
		if (!user.id) {
			throw new ValidationError('user has no ID');
		}

		if (!user.schoolId) {
			throw new ValidationError('user has no school ID');
		}

		const accountId = account.id;

		const external = isExternalUser ?? false;

		if (systemId !== undefined && systemId === account.systemId) {
			// SVS systemId exists, keep it and return
			return new CurrentUserBuilder({
				accountId,
				userId: user.id,
				schoolId: user.schoolId,
				roles: this.extractRoleIds(user.roles),
			})
				.asExternalUser(external)
				.withExternalSystem(systemId)
				.build();
		} else {
			return this.handleExternalUser(
				accountId,
				user.id,
				user.schoolId,
				this.extractRoleIds(user.roles),
				user.externalId,
				systemId
			);
		}
	}
}

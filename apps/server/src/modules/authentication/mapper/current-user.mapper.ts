import { CurrentUserBuilder, ICurrentUser } from '@infra/auth-guard';
import type { Account } from '@modules/account';
import { Role } from '@modules/role';
import { UserDo } from '@modules/user';
import { User } from '@modules/user';
import { ValidationError } from '@shared/common/error';
import { RoleReference } from '@shared/domain/domainobject';

export class CurrentUserMapper {
	private static extractRoleIds(roles?: (Role | RoleReference)[]): string[] {
		if (!roles) return [];
		return roles.map((role) => role.id);
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
		user: User,
		isExternalUser: boolean,
		systemId?: string
	): ICurrentUser {
		const rolesArray = user.roles.getItems();

		const currentUser = new CurrentUserBuilder({
			accountId,
			userId: user.id,
			schoolId: user.school.id,
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

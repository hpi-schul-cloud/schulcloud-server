import { AccountSave, AccountService } from '@modules/account';
import { RoleDto, RoleName, RoleService } from '@modules/role';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import crypto from 'node:crypto';
import { ExternalUserDto } from '../../../dto';
import { SchoolMissingLoggableException, UserRoleUnknownLoggableException } from '../../../loggable';

@Injectable()
export class SchulconnexUserProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {}

	public async provisionExternalUser(
		externalUser: ExternalUserDto,
		systemId: EntityId,
		schoolId?: string
	): Promise<UserDo> {
		const foundUser = await this.userService.findByExternalId(externalUser.externalId, systemId);

		const roleRefs = await this.createRoleReferences(externalUser.roles);
		if (!roleRefs?.length) {
			throw new UserRoleUnknownLoggableException(externalUser);
		}

		let createNewAccount = false;
		let user: UserDo;
		if (foundUser) {
			user = this.updateUser(externalUser, foundUser, roleRefs, schoolId);
		} else {
			if (!schoolId) {
				throw new SchoolMissingLoggableException(externalUser);
			}

			createNewAccount = true;
			user = this.createUser(externalUser, schoolId, roleRefs);
		}

		const savedUser = await this.userService.save(user);

		if (createNewAccount) {
			await this.accountService.saveWithValidation({
				userId: savedUser.id,
				username: crypto
					.createHash('sha256')
					.update(savedUser.id as string)
					.digest('base64'),
				systemId,
				activated: true,
			} as AccountSave);
		}

		return savedUser;
	}

	private async createRoleReferences(roles?: RoleName[]): Promise<RoleReference[] | undefined> {
		if (roles?.length) {
			const foundRoles = await this.roleService.findByNames(roles);
			const roleRefs = foundRoles.map(
				(role: RoleDto): RoleReference => new RoleReference({ id: role.id, name: role.name })
			);

			return roleRefs;
		}

		return undefined;
	}

	private updateUser(
		externalUser: ExternalUserDto,
		foundUser: UserDo,
		roleRefs?: RoleReference[],
		schoolId?: string
	): UserDo {
		const user = foundUser;
		user.firstName = externalUser.firstName ?? foundUser.firstName;
		user.preferredName = externalUser.preferredName ?? foundUser.preferredName;
		user.lastName = externalUser.lastName ?? foundUser.lastName;
		user.email = externalUser.email ?? foundUser.email;
		user.roles = roleRefs ?? foundUser.roles;
		user.schoolId = schoolId ?? foundUser.schoolId;
		user.birthday = externalUser.birthday ?? foundUser.birthday;

		return user;
	}

	private createUser(externalUser: ExternalUserDto, schoolId: string, roleRefs?: RoleReference[]): UserDo {
		const user = new UserDo({
			externalId: externalUser.externalId,
			firstName: externalUser.firstName ?? '',
			preferredName: externalUser.preferredName,
			lastName: externalUser.lastName ?? '',
			email: externalUser.email ?? '',
			roles: roleRefs ?? [],
			schoolId,
			birthday: externalUser.birthday,
			secondarySchools: [],
		});

		return user;
	}
}

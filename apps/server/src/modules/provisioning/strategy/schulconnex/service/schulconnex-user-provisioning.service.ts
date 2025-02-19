import { AccountSave, AccountService } from '@modules/account';
import { RoleDto, RoleService } from '@modules/role';
import { UserService } from '@modules/user';
import { UserDO } from '@modules/user/domain';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import CryptoJS from 'crypto-js';
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
	): Promise<UserDO> {
		const foundUser: UserDO | null = await this.userService.findByExternalId(externalUser.externalId, systemId);

		const roleRefs: RoleReference[] | undefined = await this.createRoleReferences(externalUser.roles);
		if (!roleRefs?.length) {
			throw new UserRoleUnknownLoggableException(externalUser);
		}

		let createNewAccount = false;
		let user: UserDO;
		if (foundUser) {
			user = this.updateUser(externalUser, foundUser, roleRefs, schoolId);
		} else {
			if (!schoolId) {
				throw new SchoolMissingLoggableException(externalUser);
			}

			createNewAccount = true;
			user = this.createUser(externalUser, schoolId, roleRefs);
		}

		const savedUser: UserDO = await this.userService.save(user);

		if (createNewAccount) {
			await this.accountService.saveWithValidation({
				userId: savedUser.id,
				username: CryptoJS.SHA256(savedUser.id as string).toString(CryptoJS.enc.Base64),
				systemId,
				activated: true,
			} as AccountSave);
		}

		return savedUser;
	}

	private async createRoleReferences(roles?: RoleName[]): Promise<RoleReference[] | undefined> {
		if (roles?.length) {
			const foundRoles: RoleDto[] = await this.roleService.findByNames(roles);
			const roleRefs: RoleReference[] = foundRoles.map(
				(role: RoleDto): RoleReference => new RoleReference({ id: role.id, name: role.name })
			);

			return roleRefs;
		}

		return undefined;
	}

	private updateUser(
		externalUser: ExternalUserDto,
		foundUser: UserDO,
		roleRefs?: RoleReference[],
		schoolId?: string
	): UserDO {
		const user: UserDO = foundUser;
		user.firstName = externalUser.firstName ?? foundUser.firstName;
		user.preferredName = externalUser.preferredName ?? foundUser.preferredName;
		user.lastName = externalUser.lastName ?? foundUser.lastName;
		user.email = externalUser.email ?? foundUser.email;
		user.roles = roleRefs ?? foundUser.roles;
		user.schoolId = schoolId ?? foundUser.schoolId;
		user.birthday = externalUser.birthday ?? foundUser.birthday;

		return user;
	}

	private createUser(externalUser: ExternalUserDto, schoolId: string, roleRefs?: RoleReference[]): UserDO {
		const user: UserDO = new UserDO({
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

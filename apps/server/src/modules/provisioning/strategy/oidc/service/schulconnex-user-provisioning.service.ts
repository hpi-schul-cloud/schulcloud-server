import { AccountSave, AccountService } from '@modules/account';
import { EmailAlreadyExistsLoggable } from '@modules/provisioning/loggable';
import { RoleDto, RoleService } from '@modules/role';
import { UserService } from '@modules/user';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { RoleReference, UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import CryptoJS from 'crypto-js';
import { ExternalUserDto } from '../../../dto';

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
		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUser.externalId, systemId);
		if (externalUser.email) {
			await this.checkUniqueEmail(externalUser.email, systemId, schoolId, existingUser?.externalId);
		}

		let roleRefs: RoleReference[] | undefined;
		if (externalUser.roles) {
			const roles: RoleDto[] = await this.roleService.findByNames(externalUser.roles);
			roleRefs = roles.map((role: RoleDto): RoleReference => new RoleReference({ id: role.id || '', name: role.name }));
		}

		let user: UserDO;
		let createNewAccount = false;
		if (existingUser) {
			user = existingUser;
			user.firstName = externalUser.firstName ?? existingUser.firstName;
			user.lastName = externalUser.lastName ?? existingUser.lastName;
			user.email = externalUser.email ?? existingUser.email;
			user.roles = roleRefs ?? existingUser.roles;
			user.schoolId = schoolId ?? existingUser.schoolId;
			user.birthday = externalUser.birthday ?? existingUser.birthday;
		} else {
			createNewAccount = true;

			if (!schoolId) {
				throw new UnprocessableEntityException(
					`Unable to create new external user ${externalUser.externalId} without a school`
				);
			}

			user = new UserDO({
				externalId: externalUser.externalId,
				firstName: externalUser.firstName ?? '',
				lastName: externalUser.lastName ?? '',
				email: externalUser.email ?? '',
				roles: roleRefs ?? [],
				schoolId,
				birthday: externalUser.birthday,
			});
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

	private async checkUniqueEmail(
		email: string,
		systemId: string,
		schoolId?: string,
		externalId?: string
	): Promise<void> {
		const foundUsers: UserDO[] = await this.userService.findByEmail(email);
		const unmatchedUsers: UserDO[] = foundUsers.filter((user: UserDO) => user.externalId !== externalId);

		if (unmatchedUsers.length || (!externalId && foundUsers.length)) {
			throw new EmailAlreadyExistsLoggable(email, systemId, schoolId, externalId);
		}
	}
}

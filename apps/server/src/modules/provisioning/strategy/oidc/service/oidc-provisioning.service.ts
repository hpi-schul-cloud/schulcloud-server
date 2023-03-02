import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user';
import CryptoJS from 'crypto-js';
import { ExternalSchoolDto, ExternalUserDto } from '../../../dto';

@Injectable()
export class OidcProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: SchoolService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService
	) {}

	async provisionExternalSchool(externalSchool: ExternalSchoolDto, systemId: EntityId): Promise<SchoolDO> {
		const existingSchool: SchoolDO | null = await this.schoolService.getSchoolByExternalId(
			externalSchool.externalId,
			systemId
		);
		let school: SchoolDO;
		if (existingSchool) {
			school = existingSchool;
			school.name = externalSchool.name;
			school.officialSchoolNumber = externalSchool.officialSchoolNumber ?? existingSchool.officialSchoolNumber;
			if (!school.systems) {
				school.systems = [systemId];
			} else if (!school.systems.includes(systemId)) {
				school.systems.push(systemId);
			}
		} else {
			school = new SchoolDO({
				externalId: externalSchool.externalId,
				name: externalSchool.name,
				officialSchoolNumber: externalSchool.officialSchoolNumber,
				systems: [systemId],
			});
		}

		const savedSchool: SchoolDO = await this.schoolService.createOrUpdateSchool(school);
		return savedSchool;
	}

	async provisionExternalUser(externalUser: ExternalUserDto, systemId: EntityId, schoolId?: string): Promise<UserDO> {
		let roleIds: EntityId[] | undefined;
		if (externalUser.roles) {
			const roles: RoleDto[] = await this.roleService.findByNames(externalUser.roles);
			roleIds = roles.map((role: RoleDto): EntityId => role.id || '');
		}

		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUser.externalId, systemId);
		let user: UserDO;
		let createNewAccount = false;
		if (existingUser) {
			user = existingUser;
			user.firstName = externalUser.firstName ?? existingUser.firstName;
			user.lastName = externalUser.lastName ?? existingUser.lastName;
			user.email = externalUser.email ?? existingUser.email;
			user.roleIds = roleIds ?? existingUser.roleIds;
			user.schoolId = schoolId ?? existingUser.schoolId;
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
				roleIds: roleIds ?? [],
				schoolId,
			});
		}

		const savedUser: UserDO = await this.userService.save(user);

		if (createNewAccount) {
			await this.accountService.saveWithValidation(
				new AccountSaveDto({
					userId: savedUser.id,
					username: CryptoJS.SHA256(savedUser.id as string).toString(CryptoJS.enc.Base64),
					systemId,
					activated: true,
				})
			);
		}

		return savedUser;
	}
}

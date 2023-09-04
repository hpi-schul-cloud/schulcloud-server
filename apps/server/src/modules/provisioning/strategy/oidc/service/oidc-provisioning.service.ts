import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
	EntityId,
	FederalState,
	LegacySchoolDo,
	RoleReference,
	SchoolFeatures,
	SchoolYear,
	UserDO,
} from '@shared/domain';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { FederalStateService, LegacySchoolService, SchoolYearService } from '@src/modules/school';
import { FederalStateNames } from '@src/modules/school/types';
import { UserService } from '@src/modules/user';
import CryptoJS from 'crypto-js';
import { ExternalSchoolDto, ExternalUserDto } from '../../../dto';

@Injectable()
export class OidcProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly schoolYearService: SchoolYearService,
		private readonly federalStateService: FederalStateService
	) {}

	async provisionExternalSchool(externalSchool: ExternalSchoolDto, systemId: EntityId): Promise<LegacySchoolDo> {
		const existingSchool: LegacySchoolDo | null = await this.schoolService.getSchoolByExternalId(
			externalSchool.externalId,
			systemId
		);
		let school: LegacySchoolDo;
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
			const schoolYear: SchoolYear = await this.schoolYearService.getCurrentSchoolYear();
			const federalState: FederalState = await this.federalStateService.findFederalStateByName(
				FederalStateNames.NIEDERSACHEN
			);

			school = new LegacySchoolDo({
				externalId: externalSchool.externalId,
				name: externalSchool.name,
				officialSchoolNumber: externalSchool.officialSchoolNumber,
				systems: [systemId],
				features: [SchoolFeatures.OAUTH_PROVISIONING_ENABLED],
				// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
				schoolYear,
				federalState,
			});
		}

		const savedSchool: LegacySchoolDo = await this.schoolService.save(school, true);
		return savedSchool;
	}

	async provisionExternalUser(externalUser: ExternalUserDto, systemId: EntityId, schoolId?: string): Promise<UserDO> {
		let roleRefs: RoleReference[] | undefined;
		if (externalUser.roles) {
			const roles: RoleDto[] = await this.roleService.findByNames(externalUser.roles);
			roleRefs = roles.map((role: RoleDto): RoleReference => new RoleReference({ id: role.id || '', name: role.name }));
		}

		const existingUser: UserDO | null = await this.userService.findByExternalId(externalUser.externalId, systemId);
		let user: UserDO;
		let createNewAccount = false;
		if (existingUser) {
			user = existingUser;
			user.firstName = externalUser.firstName ?? existingUser.firstName;
			user.lastName = externalUser.lastName ?? existingUser.lastName;
			user.email = externalUser.email ?? existingUser.email;
			user.roles = roleRefs ?? existingUser.roles;
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
				roles: roleRefs ?? [],
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

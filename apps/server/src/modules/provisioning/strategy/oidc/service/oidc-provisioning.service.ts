import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { EntityId, ExternalSource, FederalState, SchoolFeatures, SchoolYear } from '@shared/domain';
import { RoleReference } from '@shared/domain/domainobject';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { RoleService } from '@src/modules/role';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { FederalStateService, SchoolService, SchoolYearService } from '@src/modules/school';
import { FederalStateNames } from '@src/modules/school/types';
import { UserService } from '@src/modules/user';
import CryptoJS from 'crypto-js';
import { Group, GroupService, GroupUser } from '@src/modules/group';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { ExternalSchoolDto, ExternalUserDto, ExternalGroupDto, ExternalGroupUserDto } from '../../../dto';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';

@Injectable()
export class OidcProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: SchoolService,
		private readonly groupService: GroupService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly schoolYearService: SchoolYearService,
		private readonly federalStateService: FederalStateService,
		private readonly logger: Logger
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
			const schoolYear: SchoolYear = await this.schoolYearService.getCurrentSchoolYear();
			const federalState: FederalState = await this.federalStateService.findFederalStateByName(
				FederalStateNames.NIEDERSACHEN
			);

			school = new SchoolDO({
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

		const savedSchool: SchoolDO = await this.schoolService.save(school, true);
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

	async provisionExternalGroup(externalGroup: ExternalGroupDto, systemId: EntityId): Promise<void> {
		const existingGroup: Group | null = await this.groupService.findByExternalSource(
			externalGroup.externalId,
			systemId
		);

		let organizationId: string | undefined;
		if (externalGroup.externalOrganizationId) {
			const existingSchool: SchoolDO | null = await this.schoolService.getSchoolByExternalId(
				externalGroup.externalOrganizationId,
				systemId
			);

			if (!existingSchool || !existingSchool.id) {
				this.logger.info(new SchoolForGroupNotFoundLoggable(externalGroup));
				return;
			}

			organizationId = existingSchool.id;
		}

		const users: GroupUser[] = await this.getFilteredGroupUsers(externalGroup, systemId);

		const group: Group = new Group({
			id: existingGroup ? existingGroup.id : new ObjectId().toHexString(),
			name: externalGroup.name,
			externalSource: new ExternalSource({
				externalId: externalGroup.externalId,
				systemId,
			}),
			type: externalGroup.type,
			organizationId,
			validFrom: externalGroup.from,
			validUntil: externalGroup.until,
			users,
		});

		await this.groupService.save(group);
	}

	private async getFilteredGroupUsers(externalGroup: ExternalGroupDto, systemId: string): Promise<GroupUser[]> {
		const users: (GroupUser | null)[] = await Promise.all(
			externalGroup.users.map(async (externalGroupUser: ExternalGroupUserDto): Promise<GroupUser | null> => {
				const user: UserDO | null = await this.userService.findByExternalId(externalGroupUser.externalUserId, systemId);
				const roles: RoleDto[] = await this.roleService.findByNames([externalGroupUser.roleName]);

				if (!user || !user.id || roles.length !== 1 || !roles[0].id) {
					this.logger.info(new UserForGroupNotFoundLoggable(externalGroupUser));
					return null;
				}

				const groupUser: GroupUser = new GroupUser({
					userId: user.id,
					roleId: roles[0].id,
				});

				return groupUser;
			})
		);

		const filteredUsers: GroupUser[] = users.filter((groupUser): groupUser is GroupUser => groupUser !== null);

		return filteredUsers;
	}
}

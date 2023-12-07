import { AccountService } from '@modules/account/services/account.service';
import { AccountSaveDto } from '@modules/account/services/dto';
import { Group, GroupService, GroupUser } from '@modules/group';
import { FederalStateService, LegacySchoolService, SchoolYearService } from '@modules/legacy-school';
import { FederalStateNames } from '@modules/legacy-school/types';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { UserService } from '@modules/user';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId, ExternalSource, FederalStateEntity, SchoolYearEntity } from '@shared/domain';
import { LegacySchoolDo, RoleReference, UserDO } from '@shared/domain/domainobject';
import { SchoolFeature } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import CryptoJS from 'crypto-js';
import { ExternalGroupDto, ExternalGroupUserDto, ExternalSchoolDto, ExternalUserDto } from '../../../dto';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';

@Injectable()
export class OidcProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
		private readonly groupService: GroupService,
		private readonly roleService: RoleService,
		private readonly accountService: AccountService,
		private readonly schoolYearService: SchoolYearService,
		private readonly federalStateService: FederalStateService,
		private readonly logger: Logger
	) {}

	async provisionExternalSchool(externalSchool: ExternalSchoolDto, systemId: EntityId): Promise<LegacySchoolDo> {
		const existingSchool: LegacySchoolDo | null = await this.schoolService.getSchoolByExternalId(
			externalSchool.externalId,
			systemId
		);
		let school: LegacySchoolDo;
		if (existingSchool) {
			school = existingSchool;
			school.name = this.getSchoolName(externalSchool);
			school.officialSchoolNumber = externalSchool.officialSchoolNumber ?? existingSchool.officialSchoolNumber;
			if (!school.systems) {
				school.systems = [systemId];
			} else if (!school.systems.includes(systemId)) {
				school.systems.push(systemId);
			}
		} else {
			const schoolYear: SchoolYearEntity = await this.schoolYearService.getCurrentSchoolYear();
			const federalState: FederalStateEntity = await this.federalStateService.findFederalStateByName(
				FederalStateNames.NIEDERSACHEN
			);

			school = new LegacySchoolDo({
				externalId: externalSchool.externalId,
				name: this.getSchoolName(externalSchool),
				officialSchoolNumber: externalSchool.officialSchoolNumber,
				systems: [systemId],
				features: [SchoolFeature.OAUTH_PROVISIONING_ENABLED],
				// TODO: N21-990 Refactoring: Create domain objects for schoolYear and federalState
				schoolYear,
				federalState,
			});
		}

		const savedSchool: LegacySchoolDo = await this.schoolService.save(school, true);

		return savedSchool;
	}

	private getSchoolName(externalSchool: ExternalSchoolDto): string {
		const schoolName: string = externalSchool.location
			? `${externalSchool.name} (${externalSchool.location})`
			: externalSchool.name;

		return schoolName;
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
			const existingSchool: LegacySchoolDo | null = await this.schoolService.getSchoolByExternalId(
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

		if (!users.length) {
			return;
		}

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
			users: existingGroup ? existingGroup.users : [],
		});
		users.forEach((user: GroupUser) => group.addUser(user));

		await this.groupService.save(group);
	}

	private async getFilteredGroupUsers(externalGroup: ExternalGroupDto, systemId: string): Promise<GroupUser[]> {
		const users: (GroupUser | null)[] = await Promise.all(
			externalGroup.users.map(async (externalGroupUser: ExternalGroupUserDto): Promise<GroupUser | null> => {
				const user: UserDO | null = await this.userService.findByExternalId(externalGroupUser.externalUserId, systemId);
				const roles: RoleDto[] = await this.roleService.findByNames([externalGroupUser.roleName]);

				if (!user?.id || roles.length !== 1 || !roles[0].id) {
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

	async removeExternalGroupsAndAffiliation(
		externalUserId: EntityId,
		externalGroups: ExternalGroupDto[],
		systemId: EntityId
	): Promise<void> {
		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user) {
			throw new NotFoundLoggableException(UserDO.name, 'externalId', externalUserId);
		}

		const existingGroupsOfUser: Group[] = await this.groupService.findByUser(user);

		const groupsFromSystem: Group[] = existingGroupsOfUser.filter(
			(existingGroup: Group) => existingGroup.externalSource?.systemId === systemId
		);

		const groupsWithoutUser: Group[] = groupsFromSystem.filter((existingGroupFromSystem: Group) => {
			const isUserInGroup = externalGroups.some(
				(externalGroup: ExternalGroupDto) =>
					externalGroup.externalId === existingGroupFromSystem.externalSource?.externalId
			);

			return !isUserInGroup;
		});

		await Promise.all(
			groupsWithoutUser.map(async (group: Group) => {
				group.removeUser(user);

				if (group.isEmpty()) {
					await this.groupService.delete(group);
				} else {
					await this.groupService.save(group);
				}
			})
		);
	}
}

import { ObjectId } from 'bson';
import { AccountSaveDto, AccountService } from '@modules/account';
import { Group, GroupService, GroupTypes, GroupUser } from '@modules/group';
import {
	FederalStateService,
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchoolYearService,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { FederalStateNames } from '@modules/legacy-school/types';
import { RoleService } from '@modules/role';
import { RoleDto } from '@modules/role/service/dto/role.dto';
import { UserService } from '@modules/user';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { ExternalSource, LegacySchoolDo, RoleReference, UserDO } from '@shared/domain/domainobject';
import { FederalStateEntity, SchoolYearEntity } from '@shared/domain/entity';
import { EntityId, SchoolFeature } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
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
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService,
		private readonly logger: Logger
	) {}

	public async provisionExternalSchool(externalSchool: ExternalSchoolDto, systemId: EntityId): Promise<LegacySchoolDo> {
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

	public async provisionExternalUser(
		externalUser: ExternalUserDto,
		systemId: EntityId,
		schoolId?: string
	): Promise<UserDO> {
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

	public async filterExternalGroups(
		externalGroups: ExternalGroupDto[],
		schoolId: EntityId | undefined,
		systemId: EntityId
	): Promise<ExternalGroupDto[]> {
		let filteredGroups: ExternalGroupDto[] = externalGroups;

		const provisioningOptions: SchulConneXProvisioningOptions = await this.getProvisioningOptionsOrDefault(
			schoolId,
			systemId
		);

		if (!provisioningOptions.groupProvisioningClassesEnabled) {
			filteredGroups = filteredGroups.filter((group: ExternalGroupDto) => group.type !== GroupTypes.CLASS);
		}

		if (!provisioningOptions.groupProvisioningCoursesEnabled) {
			filteredGroups = filteredGroups.filter((group: ExternalGroupDto) => group.type !== GroupTypes.COURSE);
		}

		if (!provisioningOptions.groupProvisioningOtherEnabled) {
			filteredGroups = filteredGroups.filter((group: ExternalGroupDto) => group.type !== GroupTypes.OTHER);
		}

		return filteredGroups;
	}

	private async getProvisioningOptionsOrDefault(
		schoolId: string | undefined,
		systemId: string
	): Promise<SchulConneXProvisioningOptions> {
		let provisioningOptions: SchulConneXProvisioningOptions;

		if (schoolId) {
			provisioningOptions = await this.schoolSystemOptionsService.getProvisioningOptions(
				SchulConneXProvisioningOptions,
				schoolId,
				systemId
			);
		} else {
			provisioningOptions = new SchulConneXProvisioningOptions();
		}

		return provisioningOptions;
	}

	public async provisionExternalGroup(
		externalGroup: ExternalGroupDto,
		externalSchool: ExternalSchoolDto | undefined,
		systemId: EntityId
	): Promise<void> {
		let organizationId: string | undefined;
		if (externalSchool) {
			const existingSchool: LegacySchoolDo | null = await this.schoolService.getSchoolByExternalId(
				externalSchool.externalId,
				systemId
			);

			if (!existingSchool || !existingSchool.id) {
				this.logger.info(new SchoolForGroupNotFoundLoggable(externalGroup, externalSchool));
				return;
			}

			organizationId = existingSchool.id;
		}

		const existingGroup: Group | null = await this.groupService.findByExternalSource(
			externalGroup.externalId,
			systemId
		);

		const group: Group = new Group({
			id: existingGroup?.id ?? new ObjectId().toHexString(),
			name: externalGroup.name,
			externalSource: new ExternalSource({
				externalId: externalGroup.externalId,
				systemId,
			}),
			type: externalGroup.type,
			organizationId,
			validFrom: externalGroup.from,
			validUntil: externalGroup.until,
			users: existingGroup?.users ?? [],
		});

		if (externalGroup.otherUsers !== undefined) {
			const otherUsers: GroupUser[] = await this.getFilteredGroupUsers(externalGroup, systemId);

			group.users = otherUsers;
		}

		const self: GroupUser | null = await this.getGroupUser(externalGroup.user, systemId);

		if (!self) {
			throw new NotFoundLoggableException(UserDO.name, { externalId: externalGroup.user.externalUserId });
		}

		group.addUser(self);

		await this.groupService.save(group);
	}

	private async getFilteredGroupUsers(externalGroup: ExternalGroupDto, systemId: string): Promise<GroupUser[]> {
		if (!externalGroup.otherUsers?.length) {
			return [];
		}

		const users: (GroupUser | null)[] = await Promise.all(
			externalGroup.otherUsers.map(
				async (externalGroupUser: ExternalGroupUserDto): Promise<GroupUser | null> =>
					this.getGroupUser(externalGroupUser, systemId)
			)
		);

		const filteredUsers: GroupUser[] = users.filter((groupUser): groupUser is GroupUser => groupUser !== null);

		return filteredUsers;
	}

	private async getGroupUser(externalGroupUser: ExternalGroupUserDto, systemId: EntityId): Promise<GroupUser | null> {
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
	}

	public async removeExternalGroupsAndAffiliation(
		externalUserId: string,
		externalGroups: ExternalGroupDto[],
		systemId: EntityId
	): Promise<void> {
		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user) {
			throw new NotFoundLoggableException(UserDO.name, { externalId: externalUserId });
		}

		const existingGroupsOfUser: Group[] = await this.groupService.findGroupsByUserAndGroupTypes(user);

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

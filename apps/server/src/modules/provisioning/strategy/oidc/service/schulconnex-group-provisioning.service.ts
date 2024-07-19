import { ObjectId } from '@mikro-orm/mongodb';
import { Group, GroupFilter, GroupService, GroupTypes, GroupUser } from '@modules/group';
import { CourseDoService } from '@modules/learnroom';
import {
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { RoleDto, RoleService } from '@modules/role';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { ExternalSource, LegacySchoolDo, Page, UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { ExternalGroupDto, ExternalGroupUserDto, ExternalSchoolDto } from '../../../dto';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';
import { Course } from '../../../../learnroom/domain';

@Injectable()
export class SchulconnexGroupProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
		private readonly roleService: RoleService,
		private readonly groupService: GroupService,
		private readonly courseService: CourseDoService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService,
		private readonly logger: Logger
	) {}

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
	): Promise<Group | null> {
		let organizationId: string | undefined;
		if (externalSchool) {
			const existingSchool: LegacySchoolDo | null = await this.schoolService.getSchoolByExternalId(
				externalSchool.externalId,
				systemId
			);

			if (!existingSchool || !existingSchool.id) {
				this.logger.info(new SchoolForGroupNotFoundLoggable(externalGroup, externalSchool));
				return null;
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
				lastSyncedAt: new Date(),
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

		const savedGroup: Group = await this.groupService.save(group);

		return savedGroup;
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
	): Promise<Group[]> {
		const user: UserDO | null = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user) {
			throw new NotFoundLoggableException(UserDO.name, { externalId: externalUserId });
		}

		const filter: GroupFilter = { userId: user.id };
		const existingGroupsOfUser: Page<Group> = await this.groupService.findGroups(filter);

		const groupsFromSystem: Group[] = existingGroupsOfUser.data.filter(
			(existingGroup: Group) => existingGroup.externalSource?.systemId === systemId
		);

		const groupsWithoutUser: Group[] = groupsFromSystem.filter((existingGroupFromSystem: Group) => {
			const isUserInGroup = externalGroups.some(
				(externalGroup: ExternalGroupDto) =>
					externalGroup.externalId === existingGroupFromSystem.externalSource?.externalId
			);

			return !isUserInGroup;
		});

		const groupRemovePromises: Promise<Group | null>[] = groupsWithoutUser.map(
			async (group: Group): Promise<Group | null> => {
				group.removeUser(user);

				if (group.isEmpty()) {
					const courses: Course[] = await this.courseService.findBySyncedGroup(group);
					if (!courses) {
						await this.groupService.delete(group);
					}
					return null;
				}

				return this.groupService.save(group);
			}
		);

		const deletedAndModifiedGroups: (Group | null)[] = await Promise.all(groupRemovePromises);

		const remainingGroups: Group[] = deletedAndModifiedGroups.filter((group: Group | null): group is Group => !!group);

		return remainingGroups;
	}
}

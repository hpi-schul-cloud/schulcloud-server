import { Logger } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseDoService } from '@modules/course';
import { Group, GroupPeriod, GroupService, GroupTypes, GroupUser } from '@modules/group';
import {
	LegacySchoolService,
	SchoolSystemOptionsService,
	SchulConneXProvisioningOptions,
} from '@modules/legacy-school';
import { RoleService } from '@modules/role';
import { UserDo, UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { ExternalSource } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ExternalGroupDto, ExternalGroupUserDto, ExternalSchoolDto } from '../../../dto';
import { SchoolForGroupNotFoundLoggable, UserForGroupNotFoundLoggable } from '../../../loggable';
import { SchulconnexCourseSyncService } from './schulconnex-course-sync.service';

@Injectable()
export class SchulconnexGroupProvisioningService {
	constructor(
		private readonly userService: UserService,
		private readonly schoolService: LegacySchoolService,
		private readonly roleService: RoleService,
		private readonly groupService: GroupService,
		private readonly courseService: CourseDoService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService,
		private readonly schulconnexCourseSyncService: SchulconnexCourseSyncService,
		private readonly logger: Logger
	) {}

	public async filterExternalGroups(
		externalGroups: ExternalGroupDto[],
		schoolId: EntityId | undefined,
		systemId: EntityId
	): Promise<ExternalGroupDto[]> {
		let filteredGroups = externalGroups;

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
			const existingSchool = await this.schoolService.getSchoolByExternalId(externalSchool.externalId, systemId);

			if (!existingSchool || !existingSchool.id) {
				this.logger.info(new SchoolForGroupNotFoundLoggable(externalGroup, externalSchool));
				return null;
			}

			organizationId = existingSchool.id;
		}

		const existingGroup = await this.groupService.findByExternalSource(externalGroup.externalId, systemId);

		const group = new Group({
			id: existingGroup?.id ?? new ObjectId().toHexString(),
			name: externalGroup.name,
			externalSource: new ExternalSource({
				externalId: externalGroup.externalId,
				systemId,
				lastSyncedAt: new Date(),
			}),
			type: externalGroup.type,
			organizationId,
			validPeriod:
				externalGroup.from && externalGroup.until
					? new GroupPeriod({ from: externalGroup.from, until: externalGroup.until })
					: undefined,
			users: existingGroup?.users ?? [],
		});

		if (externalGroup.otherUsers !== undefined) {
			const otherUsers = await this.getFilteredGroupUsers(externalGroup, systemId);

			group.users = otherUsers;
		}

		const self = await this.getGroupUser(externalGroup.user, systemId);

		if (!self) {
			throw new NotFoundLoggableException(UserDo.name, { externalId: externalGroup.user.externalUserId });
		}

		group.addUser(self);

		const savedGroup = await this.groupService.save(group);

		return savedGroup;
	}

	private async getFilteredGroupUsers(externalGroup: ExternalGroupDto, systemId: string): Promise<GroupUser[]> {
		if (!externalGroup.otherUsers?.length) {
			return [];
		}

		const users = await Promise.all(
			externalGroup.otherUsers.map(
				async (externalGroupUser: ExternalGroupUserDto): Promise<GroupUser | null> =>
					this.getGroupUser(externalGroupUser, systemId)
			)
		);

		const filteredUsers = users.filter((groupUser): groupUser is GroupUser => groupUser !== null);

		return filteredUsers;
	}

	private async getGroupUser(externalGroupUser: ExternalGroupUserDto, systemId: EntityId): Promise<GroupUser | null> {
		const user = await this.userService.findByExternalId(externalGroupUser.externalUserId, systemId);
		const roles = await this.roleService.findByNames([externalGroupUser.roleName]);

		if (!user?.id || roles.length !== 1 || !roles[0].id) {
			this.logger.info(new UserForGroupNotFoundLoggable(externalGroupUser));
			return null;
		}

		const groupUser = new GroupUser({
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
		const user = await this.userService.findByExternalId(externalUserId, systemId);

		if (!user?.id) {
			throw new NotFoundLoggableException(UserDo.name, { externalId: externalUserId });
		}
		const userId = user.id;

		const filter = { userId };
		const existingGroupsOfUser = await this.groupService.findGroups(filter);

		const groupsFromSystem = existingGroupsOfUser.data.filter(
			(existingGroup: Group) => existingGroup.externalSource?.systemId === systemId
		);

		const groupsWithoutUser = groupsFromSystem.filter((existingGroupFromSystem: Group) => {
			const isUserInGroup = externalGroups.some(
				(externalGroup: ExternalGroupDto) =>
					externalGroup.externalId === existingGroupFromSystem.externalSource?.externalId
			);

			return !isUserInGroup;
		});

		const groupRemovePromises = groupsWithoutUser.map(async (group: Group): Promise<Group | null> => {
			group.removeUser(userId);

			if (group.isEmpty()) {
				const courses = await this.courseService.findBySyncedGroup(group);

				if (courses.length > 0) {
					await this.schulconnexCourseSyncService.desyncCoursesAndCreateHistories(group, courses);
				}

				await this.groupService.delete(group);
				return null;
			}

			return this.groupService.save(group);
		});

		const deletedAndModifiedGroups = await Promise.all(groupRemovePromises);
		const remainingGroups = deletedAndModifiedGroups.filter((group: Group | null): group is Group => !!group);

		return remainingGroups;
	}

	public async removeUserFromGroup(userId: EntityId, groupId: EntityId): Promise<Group | null> {
		const group = await this.groupService.findById(groupId);

		if (!group.isMember(userId)) {
			return null;
		}

		group.removeUser(userId);

		if (group.isEmpty()) {
			const courses = await this.courseService.findBySyncedGroup(group);

			if (courses.length > 0) {
				await this.schulconnexCourseSyncService.desyncCoursesAndCreateHistories(group, courses);
			}

			await this.groupService.delete(group);
			return null;
		}

		const savedGroup = await this.groupService.save(group);

		return savedGroup;
	}
}

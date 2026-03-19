import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { RoleName, RoleService } from '@modules/role';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import {
	Group,
	GroupAggregateScope,
	GroupDeletedEvent,
	GroupFilter,
	GroupTypes,
	GroupUser,
	GroupVisibilityPermission,
} from '../domain';
import { GROUP_CONFIG_TOKEN, GroupConfig } from '../group.config';
import { GroupRepo } from '../repo';

@Injectable()
export class GroupService implements AuthorizationLoaderServiceGeneric<Group> {
	constructor(
		private readonly groupRepo: GroupRepo,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly eventBus: EventBus,
		@Inject(GROUP_CONFIG_TOKEN)
		private readonly config: GroupConfig
	) {}

	public async findById(id: EntityId): Promise<Group> {
		const group: Group | null = await this.groupRepo.findGroupById(id);

		if (!group) {
			throw new NotFoundLoggableException(Group.name, { id });
		}

		return group;
	}

	public async tryFindById(id: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findGroupById(id);

		return group;
	}

	public async findByExternalSource(externalId: string, systemId: EntityId): Promise<Group | null> {
		const group: Group | null = await this.groupRepo.findByExternalSource(externalId, systemId);

		return group;
	}

	public async findGroups(filter: GroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findGroups(filter, options);

		return groups;
	}

	public async findByUsersAndRoomsSchoolId(schoolId: EntityId, types?: GroupTypes[]): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findByUsersAndRoomsSchoolId(schoolId, types);

		return groups;
	}

	public async findByScope(scope: GroupAggregateScope): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findGroupsForScope(scope);

		return groups;
	}

	public async findGroupsForUser(
		user: User,
		permission: GroupVisibilityPermission,
		availableGroupsForCourseSync: boolean,
		nameQuery?: string,
		options?: IFindOptions<Group>
	): Promise<Page<Group>> {
		// TODO this should be moved to repo
		const scope = new GroupAggregateScope(options)
			.byName(nameQuery)
			.byAvailableForSync(availableGroupsForCourseSync && this.config.featureSchulconnexCourseSyncEnabled);

		if (permission === GroupVisibilityPermission.ALL_SCHOOL_GROUPS) {
			scope.byOrganization(user.school.id);
		} else {
			scope.byUser(user.id);
		}

		const groups: Page<Group> = await this.groupRepo.findGroupsForScope(scope);

		return groups;
	}

	public async save(group: Group): Promise<Group> {
		const savedGroup: Group = await this.groupRepo.save(group);

		return savedGroup;
	}

	public async delete(group: Group): Promise<void> {
		await this.groupRepo.delete(group);

		await this.eventBus.publish(new GroupDeletedEvent(group));
	}

	public async createGroup(name: string, type: GroupTypes, organizationId?: EntityId): Promise<Group> {
		const group = new Group({
			name,
			users: [],
			id: new ObjectId().toHexString(),
			type,
			organizationId,
		});

		await this.save(group);

		return group;
	}

	public async addUserToGroup(groupId: EntityId, userId: EntityId, roleName: RoleName): Promise<void> {
		const role = await this.roleService.findByName(roleName);
		const group = await this.findById(groupId);
		const user = await this.userService.findById(userId);
		// user must have an id, because we are fetching it by id -> fix in service
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const groupUser = new GroupUser({ roleId: role.id, userId: user.id! });

		group.addUser(groupUser);
		await this.save(group);
	}

	public async addUsersToGroup(
		groupId: EntityId,
		userIdsAndRoles: Array<{ userId: EntityId; roleName: RoleName }>
	): Promise<Group> {
		const uniqueRoleNames = [...new Set(userIdsAndRoles.map((user) => user.roleName))];
		const roleNamesSet = await this.roleService.findByNames(uniqueRoleNames);
		const userIds = userIdsAndRoles.map((user) => user.userId);
		const users = await this.userService.findByIds(userIds);
		const group = await this.findById(groupId);

		for (const { userId, roleName } of userIdsAndRoles) {
			const role = roleNamesSet.find((r) => r.name === roleName);
			if (!role) throw new BadRequestException(`Role ${roleName} not found.`);
			const user = users.find((u) => u.id === userId);
			// user must have an id, because we are fetching it by id -> fix in service
			if (!user) throw new BadRequestException('Unknown userId.');

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const groupUser = new GroupUser({ roleId: role.id, userId: user.id! });

			group.addUser(groupUser);
		}
		await this.save(group);

		return group;
	}

	public async removeUsersFromGroup(groupId: EntityId, userIds: EntityId[]): Promise<Group> {
		const group = await this.findById(groupId);
		const users = await this.userService.findByIds(userIds);

		for (const userId of userIds) {
			const user = users.find((u) => u.id === userId);
			if (!user?.id) throw new BadRequestException('Unknown userId.');
			group.removeUser(user.id);
		}

		await this.save(group);

		return group;
	}

	public async removeUserReference(userId: EntityId): Promise<number> {
		const numberOfUpdatedGroups = await this.groupRepo.removeUserReference(userId);

		return numberOfUpdatedGroups;
	}

	public async findAllGroupsForUser(userId: EntityId): Promise<Group[]> {
		const { domainObjects } = await this.groupRepo.findGroupsByFilter({ userId });

		return domainObjects;
	}

	public async findExistingGroupsByIds(groupIds: EntityId[]): Promise<Group[]> {
		const promises = groupIds.map((groupId) => this.groupRepo.findGroupById(groupId));
		const groups = await Promise.all(promises);
		const existingGroups = groups.filter((group): group is Group => Boolean(group));

		return existingGroups;
	}

	public async getGroupName(groupId: EntityId): Promise<string | undefined> {
		const group = await this.groupRepo.findGroupById(groupId);
		const groupName = group?.name;

		return groupName;
	}
}

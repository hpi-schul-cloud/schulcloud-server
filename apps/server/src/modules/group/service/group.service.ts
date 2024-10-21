import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { RoleService } from '@src/modules/role';
import { UserService } from '@src/modules/user/service/user.service';
import { Group, GroupDeletedEvent, GroupFilter, GroupTypes, GroupUser } from '../domain';
import { GroupRepo } from '../repo';

@Injectable()
export class GroupService implements AuthorizationLoaderServiceGeneric<Group> {
	constructor(
		private readonly groupRepo: GroupRepo,
		private readonly userService: UserService,
		private readonly roleService: RoleService,
		private readonly eventBus: EventBus
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

	public async findAvailableGroups(filter: GroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findAvailableGroups(filter, options);

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
		if (!role.id) throw new BadRequestException('Role has no id.');
		const group = await this.findById(groupId);
		const user = await this.userService.findById(userId);
		// user must have an id, because we are fetching it by id -> fix in service
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const groupUser = new GroupUser({ roleId: role.id, userId: user.id! });

		group.addUser(groupUser);
		await this.save(group);
	}
}

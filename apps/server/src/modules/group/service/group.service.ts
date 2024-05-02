import { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { Page, type UserDO } from '@shared/domain/domainobject';
import { IFindOptions, IFindQuery, IGroupFilter } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { Group, GroupDeletedEvent, GroupTypes } from '../domain';
import { GroupRepo } from '../repo';

@Injectable()
export class GroupService implements AuthorizationLoaderServiceGeneric<Group> {
	constructor(private readonly groupRepo: GroupRepo, private readonly eventBus: EventBus) {}

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

	public async findGroupsByUserAndGroupTypes(
		user: UserDO,
		groupTypes?: GroupTypes[],
		query?: IFindQuery
	): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findByUserAndGroupTypes(user, groupTypes, query);

		return groups;
	}

	public async findAvailableGroupsByUser(user: UserDO, query?: IFindQuery): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findAvailableByUser(user, query);

		return groups;
	}

	public async findGroupsBySchoolIdAndGroupTypes(
		school: School,
		groupTypes?: GroupTypes[],
		query?: IFindQuery
	): Promise<Page<Group>> {
		const group: Page<Group> = await this.groupRepo.findBySchoolIdAndGroupTypes(school, groupTypes, query);

		return group;
	}

	public async findAvailableGroupsBySchoolId(school: School, query?: IFindQuery): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findAvailableBySchoolId(school, query);

		return groups;
	}

	public async findGroupsBySchoolIdAndSystemIdAndGroupType(
		schoolId: EntityId,
		systemId: EntityId,
		groupType: GroupTypes
	): Promise<Group[]> {
		const group: Group[] = await this.groupRepo.findGroupsBySchoolIdAndSystemIdAndGroupType(
			schoolId,
			systemId,
			groupType
		);

		return group;
	}

	public async findGroups(filter: IGroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
		const groups: Page<Group> = await this.groupRepo.findGroups(filter, options);

		return groups;
	}

	public async findAvailableGroups(filter: IGroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
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
}

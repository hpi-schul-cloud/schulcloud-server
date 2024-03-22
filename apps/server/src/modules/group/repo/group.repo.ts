import { EntityData, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { type UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Group, GroupTypes } from '../domain';
import { GroupEntity, GroupEntityTypes } from '../entity';
import { GroupDomainMapper, GroupTypesToGroupEntityTypesMapping } from './group-domain.mapper';
import { GroupScope } from './group.scope';

// the query flow doesn't work. The returned entity is missing attributes and ids are given in Buffer form
const queryFlow = false;

@Injectable()
export class GroupRepo extends BaseDomainObjectRepo<Group, GroupEntity> {
	protected get entityName(): EntityName<GroupEntity> {
		return GroupEntity;
	}

	protected mapDOToEntityProperties(entityDO: Group): EntityData<GroupEntity> {
		const entityProps: EntityData<GroupEntity> = GroupDomainMapper.mapDoToEntityData(entityDO, this.em);

		return entityProps;
	}

	public async findGroupById(id: EntityId): Promise<Group | null> {
		const entity: GroupEntity | null = await this.em.findOne(GroupEntity, { id });

		if (!entity) {
			return null;
		}

		const domainObject: Group = GroupDomainMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findByExternalSource(externalId: string, systemId: EntityId): Promise<Group | null> {
		const entity: GroupEntity | null = await this.em.findOne(GroupEntity, {
			externalSource: {
				externalId,
				system: systemId,
			},
		});

		if (!entity) {
			return null;
		}

		const domainObject: Group = GroupDomainMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findByUserAndGroupTypes(
		user: UserDO,
		groupTypes?: GroupTypes[],
		skip?: number,
		limit?: number,
		nameQuery?: string
	): Promise<Group[]> {
		let groupEntityTypes: GroupEntityTypes[] | undefined;
		if (groupTypes) {
			groupEntityTypes = groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
		}

		const scope: Scope<GroupEntity> = new GroupScope().byUserId(user.id).byTypes(groupEntityTypes);

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query, { offset: skip, limit });

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	public async findAvailableByUser(user: UserDO, skip = 0, limit = 1000000, nameQuery?: string): Promise<Group[]> {
		let domainObjects: Group[] = [];

		if (queryFlow) {
			const pipeline = [
				{
					$lookup: {
						from: 'courses',
						localField: '_id',
						foreignField: 'syncedWithGroup',
						as: 'syncedCourses',
					},
				},
				{ $match: { syncedCourses: { $size: 0 } } },
				{ $match: { users: { user: new ObjectId(user.id) } } },
				{ $skip: skip },
				{ $limit: limit },
			];
			const entities: GroupEntity[] = (await this.em.aggregate(GroupEntity, pipeline)) as GroupEntity[];

			domainObjects = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));
		} else {
			const scope: Scope<GroupEntity> = new GroupScope().byUserId(user.id);

			const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query);
			await this.em.populate(entities, ['syncedCourses']);

			const filteredEntities: GroupEntity[] = entities.filter(
				(entity: GroupEntity) => entity.syncedCourses.length === 0
			);

			const sliceEnd = limit ? skip + limit : filteredEntities.length;

			const paginatedFilteredEntities: GroupEntity[] = filteredEntities.slice(skip, sliceEnd);

			domainObjects = paginatedFilteredEntities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));
		}

		return domainObjects;
	}

	public async findBySchoolIdAndGroupTypes(
		schoolId: EntityId,
		groupTypes?: GroupTypes[],
		skip?: number,
		limit?: number,
		nameQuery?: string
	): Promise<Group[]> {
		let groupEntityTypes: GroupEntityTypes[] | undefined;
		if (groupTypes) {
			groupEntityTypes = groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
		}

		const scope: Scope<GroupEntity> = new GroupScope().byOrganizationId(schoolId).byTypes(groupEntityTypes);

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query, { offset: skip, limit });

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	public async findAvailableBySchoolId(
		schoolId: EntityId,
		skip = 0,
		limit = 1000000,
		nameQuery?: string
	): Promise<Group[]> {
		let domainObjects: Group[] = [];

		if (queryFlow) {
			const pipeline = [
				{
					$lookup: {
						from: 'courses',
						localField: '_id',
						foreignField: 'syncedWithGroup',
						as: 'syncedCourses',
					},
				},
				{ $match: { syncedCourses: { $size: 0 } } },
				{ $match: { organization: new ObjectId(schoolId) } },
				{ $skip: skip },
				{ $limit: limit },
			];
			const entities: GroupEntity[] = (await this.em.aggregate(GroupEntity, pipeline)) as GroupEntity[];

			domainObjects = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));
		} else {
			const scope: Scope<GroupEntity> = new GroupScope().byOrganizationId(schoolId);

			const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query);
			await this.em.populate(entities, ['syncedCourses']);

			const filteredEntities: GroupEntity[] = entities.filter(
				(entity: GroupEntity) => entity.syncedCourses.length === 0
			);

			const sliceEnd = limit ? skip + limit : filteredEntities.length;

			const paginatedFilteredEntities: GroupEntity[] = filteredEntities.slice(skip, sliceEnd);

			domainObjects = paginatedFilteredEntities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));
		}

		return domainObjects;
	}

	public async findGroupsBySchoolIdAndSystemIdAndGroupType(
		schoolId: EntityId,
		systemId: EntityId,
		groupType: GroupTypes
	): Promise<Group[]> {
		const groupEntityType: GroupEntityTypes = GroupTypesToGroupEntityTypesMapping[groupType];

		const scope: Scope<GroupEntity> = new GroupScope()
			.byOrganizationId(schoolId)
			.bySystemId(systemId)
			.byTypes([groupEntityType]);

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query);

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}
}

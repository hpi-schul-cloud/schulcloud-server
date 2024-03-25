import { EntityData, EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { type UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns, Scope } from '@shared/repo';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Group, GroupTypes } from '../domain';
import { GroupEntity, GroupEntityTypes } from '../entity';
import { GroupDomainMapper, GroupTypesToGroupEntityTypesMapping } from './group-domain.mapper';
import { GroupScope } from './group.scope';

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

		let scope: Scope<GroupEntity> = new GroupScope().byUserId(user.id).byTypes(groupEntityTypes);

		if (nameQuery && StringValidator.isNotEmptyString(nameQuery, true)) {
			const escapedName = nameQuery.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			if (StringValidator.isNotEmptyString(escapedName, true)) {
				scope = new GroupScope().byUserId(user.id).byTypes(groupEntityTypes).byNameQuery(escapedName);
			}
		}

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query, { offset: skip, limit });

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	public async findAvailableByUser(user: UserDO, skip?: number, limit?: number, nameQuery?: string): Promise<Group[]> {
		const pipeline: unknown[] = [{ $match: { users: { $elemMatch: { user: new ObjectId(user.id) } } } }];
		const pipelineStages = this.buildPipeline(skip, limit, nameQuery);
		pipelineStages.forEach((stage) => pipeline.push(stage));

		const mongoEntities = await this.em.aggregate(GroupEntity, pipeline);
		const entities: GroupEntity[] = mongoEntities.map((entity: GroupEntity) => {
			const { ...newGroupEntity } = entity;
			return this.em.map(GroupEntity, newGroupEntity);
		});

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

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

		let scope: Scope<GroupEntity> = new GroupScope().byOrganizationId(schoolId).byTypes(groupEntityTypes);

		if (nameQuery && StringValidator.isNotEmptyString(nameQuery, true)) {
			const escapedName = nameQuery.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			if (StringValidator.isNotEmptyString(escapedName, true)) {
				scope = new GroupScope().byOrganizationId(schoolId).byTypes(groupEntityTypes).byNameQuery(escapedName);
			}
		}

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query, { offset: skip, limit });

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	public async findAvailableBySchoolId(
		schoolId: EntityId,
		skip?: number,
		limit?: number,
		nameQuery?: string
	): Promise<Group[]> {
		const pipeline: unknown[] = [{ $match: { organization: new ObjectId(schoolId) } }];
		const pipelineStages = this.buildPipeline(skip, limit, nameQuery);
		pipelineStages.forEach((stage) => pipeline.push(stage));

		const mongoEntities = await this.em.aggregate(GroupEntity, pipeline);
		const entities: GroupEntity[] = mongoEntities.map((entity: GroupEntity) => {
			const { ...newGroupEntity } = entity;
			return this.em.map(GroupEntity, newGroupEntity);
		});

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

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

	private buildPipeline(skip?: number, limit?: number, nameQuery?: string): unknown[] {
		let nameQueryMatch = {};
		const pipeline: unknown[] = [];

		if (nameQuery && StringValidator.isNotEmptyString(nameQuery, true)) {
			const escapedName = nameQuery.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			if (StringValidator.isNotEmptyString(escapedName, true)) {
				nameQueryMatch = { name: { $regex: nameQuery, $options: 'i' } };
			}
		}

		pipeline.push(
			{ $match: nameQueryMatch },
			{
				$lookup: {
					from: 'courses',
					localField: '_id',
					foreignField: 'syncedWithGroup',
					as: 'syncedCourses',
				},
			},
			{ $match: { syncedCourses: { $size: 0 } } }
		);

		if (skip) {
			pipeline.push({ $skip: skip });
		}

		if (limit) {
			pipeline.push({ $limit: limit });
		}

		return pipeline;
	}
}

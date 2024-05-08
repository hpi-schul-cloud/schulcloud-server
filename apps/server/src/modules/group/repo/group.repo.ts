import { EntityData, EntityDictionary, EntityName, QueryOrder } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { School } from '@modules/school';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { Page, type UserDO } from '@shared/domain/domainobject';
import { IFindQuery } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo';
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
		query?: IFindQuery
	): Promise<Page<Group>> {
		const scope: GroupScope = new GroupScope().byUserId(user.id);
		if (groupTypes) {
			const groupEntityTypes = groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
			scope.byTypes(groupEntityTypes);
		}

		const escapedName = query?.nameQuery?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		if (StringValidator.isNotEmptyString(escapedName, true)) {
			scope.byNameQuery(escapedName);
		}

		const [entities, total] = await this.em.findAndCount(GroupEntity, scope.query, {
			offset: query?.pagination?.skip,
			limit: query?.pagination?.limit,
			orderBy: { name: QueryOrder.ASC },
		});

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}

	public async findAvailableByUser(user: UserDO, query?: IFindQuery): Promise<Page<Group>> {
		const pipelineStage: unknown[] = [{ $match: { users: { $elemMatch: { user: new ObjectId(user.id) } } } }];
		const availableGroups: Page<Group> = await this.findAvailableGroup(
			pipelineStage,
			query?.pagination?.skip,
			query?.pagination?.limit,
			query?.nameQuery
		);

		return availableGroups;
	}

	public async findBySchoolIdAndGroupTypes(
		school: School,
		groupTypes?: GroupTypes[],
		query?: IFindQuery
	): Promise<Page<Group>> {
		const scope: GroupScope = new GroupScope().byOrganizationId(school.id);
		if (groupTypes) {
			const groupEntityTypes = groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
			scope.byTypes(groupEntityTypes);
		}

		const escapedName = query?.nameQuery?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		if (StringValidator.isNotEmptyString(escapedName, true)) {
			scope.byNameQuery(escapedName);
		}

		const [entities, total] = await this.em.findAndCount(GroupEntity, scope.query, {
			offset: query?.pagination?.skip,
			limit: query?.pagination?.limit,
			orderBy: { name: QueryOrder.ASC },
		});

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}

	public async findAvailableBySchoolId(school: School, query?: IFindQuery): Promise<Page<Group>> {
		const pipelineStage: unknown[] = [{ $match: { organization: new ObjectId(school.id) } }];

		const availableGroups: Page<Group> = await this.findAvailableGroup(
			pipelineStage,
			query?.pagination?.skip,
			query?.pagination?.limit,
			query?.nameQuery
		);

		return availableGroups;
	}

	public async findGroupsBySchoolIdAndSystemIdAndGroupType(
		schoolId: EntityId,
		systemId: EntityId,
		groupType: GroupTypes
	): Promise<Group[]> {
		const groupEntityType: GroupEntityTypes = GroupTypesToGroupEntityTypesMapping[groupType];

		const scope: GroupScope = new GroupScope()
			.byOrganizationId(schoolId)
			.bySystemId(systemId)
			.byTypes([groupEntityType]);

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query);

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return domainObjects;
	}

	private async findAvailableGroup(
		pipelineStage: unknown[],
		skip = 0,
		limit?: number,
		nameQuery?: string
	): Promise<Page<Group>> {
		let nameRegexFilter = {};
		const pipeline: unknown[] = pipelineStage;

		const escapedName = nameQuery?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		if (StringValidator.isNotEmptyString(escapedName, true)) {
			nameRegexFilter = { name: { $regex: escapedName, $options: 'i' } };
		}

		pipeline.push(
			{ $match: nameRegexFilter },
			{
				$lookup: {
					from: 'courses',
					localField: '_id',
					foreignField: 'syncedWithGroup',
					as: 'syncedCourses',
				},
			},
			{ $match: { syncedCourses: { $size: 0 } } },
			{ $sort: { name: 1 } }
		);

		if (limit) {
			pipeline.push({
				$facet: {
					total: [{ $count: 'count' }],
					data: [{ $skip: skip }, { $limit: limit }],
				},
			});
		} else {
			pipeline.push({
				$facet: {
					total: [{ $count: 'count' }],
					data: [{ $skip: skip }],
				},
			});
		}

		const mongoEntitiesFacet = (await this.em.aggregate(GroupEntity, pipeline)) as [
			{ total: [{ count: number }]; data: EntityDictionary<GroupEntity>[] }
		];

		const total: number = mongoEntitiesFacet[0]?.total[0]?.count ?? 0;

		const entities: GroupEntity[] = mongoEntitiesFacet[0].data.map((entity: EntityDictionary<GroupEntity>) =>
			this.em.map(GroupEntity, entity)
		);

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}
}

import { EntityData, EntityName, QueryOrder } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { MongoPatterns } from '@shared/repo';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { Group, GroupTypes, IGroupFilter } from '../domain';
import { GroupEntity } from '../entity';
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

	public async findGroups(filter: IGroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
		const scope: GroupScope = new GroupScope();
		scope.byUserId(filter.userId);
		scope.byOrganizationId(filter.schoolId);
		scope.bySystemId(filter.systemId);

		if (filter.groupTypes) {
			const groupEntityTypes = filter.groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
			scope.byTypes(groupEntityTypes);
		}

		const escapedName = filter.nameQuery?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		if (StringValidator.isNotEmptyString(escapedName, true)) {
			scope.byNameQuery(escapedName);
		}

		const [entities, total] = await this.em.findAndCount(GroupEntity, scope.query, {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: { name: QueryOrder.ASC },
		});

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}

	public async findAvailableGroups(filter: IGroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
		const pipeline: unknown[] = [];
		let nameRegexFilter = {};

		const escapedName = filter.nameQuery?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		if (StringValidator.isNotEmptyString(escapedName, true)) {
			nameRegexFilter = { name: { $regex: escapedName, $options: 'i' } };
		}

		if (filter.userId) {
			pipeline.push({ $match: { users: { $elemMatch: { user: new ObjectId(filter.userId) } } } });
		}

		if (filter.schoolId) {
			pipeline.push({ $match: { organization: new ObjectId(filter.schoolId) } });
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

		if (options?.pagination?.limit) {
			pipeline.push({
				$facet: {
					total: [{ $count: 'count' }],
					data: [{ $skip: options.pagination?.skip }, { $limit: options.pagination.limit }],
				},
			});
		} else {
			pipeline.push({
				$facet: {
					total: [{ $count: 'count' }],
					data: [{ $skip: options?.pagination?.skip }],
				},
			});
		}

		const mongoEntitiesFacet = (await this.em.aggregate(GroupEntity, pipeline)) as [
			{ total: [{ count: number }]; data: GroupEntity[] }
		];

		const total: number = mongoEntitiesFacet[0]?.total[0]?.count ?? 0;

		const entities: GroupEntity[] = mongoEntitiesFacet[0].data.map((entity: GroupEntity) =>
			this.em.map(GroupEntity, entity)
		);

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}
}

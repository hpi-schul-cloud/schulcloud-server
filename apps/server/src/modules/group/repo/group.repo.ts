import { EntityData, EntityDictionary, EntityName, QueryOrder } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { StringValidator } from '@shared/common/validator';
import { Page } from '@shared/domain/domainobject';
import { IFindOptions } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { BaseDomainObjectRepo } from '@shared/repo/base-domain-object.repo';
import { MongoPatterns } from '@shared/repo/mongo.patterns';
import { ScopeAggregateResult } from '@shared/repo/mongodb-scope';
import { Group, GroupAggregateScope, GroupFilter, GroupTypes } from '../domain';
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
				system: new ObjectId(systemId),
			},
		});

		if (!entity) {
			return null;
		}

		const domainObject: Group = GroupDomainMapper.mapEntityToDo(entity);

		return domainObject;
	}

	public async findGroupsByFilter(
		filter: GroupFilter,
		options?: IFindOptions<Group>
	): Promise<{ domainObjects: Group[]; total: number }> {
		const scope: GroupScope = new GroupScope();
		scope.byUserId(filter.userId);
		scope.byUserIds(filter.userIds);
		scope.byOrganizationId(filter.schoolId);
		scope.bySystemId(filter.systemId);

		if (filter.groupTypes) {
			const groupEntityTypes = filter.groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
			scope.byTypes(groupEntityTypes);
		}

		const escapedName = filter.nameQuery?.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
		if (StringValidator.isNotEmptyStringWhenTrimed(escapedName)) {
			scope.byNameQuery(escapedName);
		}

		const [entities, total] = await this.em.findAndCount(GroupEntity, scope.query, {
			offset: options?.pagination?.skip,
			limit: options?.pagination?.limit,
			orderBy: { name: QueryOrder.ASC },
		});

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		return { domainObjects, total };
	}

	public async findGroups(filter: GroupFilter, options?: IFindOptions<Group>): Promise<Page<Group>> {
		const { domainObjects, total } = await this.findGroupsByFilter(filter, options);
		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}

	public async findByUsersAndRoomsSchoolId(schoolId: EntityId, types?: GroupTypes[]): Promise<Page<Group>> {
		const scope: GroupAggregateScope = new GroupAggregateScope();
		scope.byType(types);
		scope.byUsersAndRoomsSchoolId(schoolId);

		const groups: Page<Group> = await this.findGroupsForScope(scope);

		return groups;
	}

	public async findGroupsForScope(scope: GroupAggregateScope): Promise<Page<Group>> {
		const mongoEntitiesFacet = (await this.em.aggregate(
			GroupEntity,
			scope.build()
		)) as ScopeAggregateResult<GroupEntity>;

		const total: number = mongoEntitiesFacet[0]?.total[0]?.count ?? 0;

		const entities: GroupEntity[] = mongoEntitiesFacet[0].data.map((entity: EntityDictionary<GroupEntity>) =>
			this.em.map(GroupEntity, entity)
		);

		const domainObjects: Group[] = entities.map((entity) => GroupDomainMapper.mapEntityToDo(entity));

		const page: Page<Group> = new Page<Group>(domainObjects, total);

		return page;
	}

	public async removeUserReference(userId: EntityId): Promise<number> {
		const scope: GroupScope = new GroupScope();
		scope.byUserId(userId);

		const count = await this.em.nativeUpdate(GroupEntity, scope.query, {
			$pull: { users: { user: new ObjectId(userId) } },
		} as Partial<GroupEntity>);
		return count;
	}
}

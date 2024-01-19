import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { type UserDO } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo';
import { Group, GroupProps, GroupTypes } from '../domain';
import { GroupEntity, GroupEntityProps, GroupEntityTypes } from '../entity';
import { GroupDomainMapper, GroupTypesToGroupEntityTypesMapping } from './group-domain.mapper';
import { GroupScope } from './group.scope';

@Injectable()
export class GroupRepo {
	constructor(private readonly em: EntityManager) {}

	public async findById(id: EntityId): Promise<Group | null> {
		const entity: GroupEntity | null = await this.em.findOne(GroupEntity, { id });

		if (!entity) {
			return null;
		}

		const props: GroupProps = GroupDomainMapper.mapEntityToDomainObjectProperties(entity);

		const domainObject: Group = new Group(props);

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

		const props: GroupProps = GroupDomainMapper.mapEntityToDomainObjectProperties(entity);

		const domainObject: Group = new Group(props);

		return domainObject;
	}

	public async findByUserAndGroupTypes(user: UserDO, groupTypes?: GroupTypes[]): Promise<Group[]> {
		let groupEntityTypes: GroupEntityTypes[] | undefined;
		if (groupTypes) {
			groupEntityTypes = groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
		}

		const scope: Scope<GroupEntity> = new GroupScope().byUserId(user.id).byTypes(groupEntityTypes);

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query);

		const domainObjects: Group[] = entities.map((entity) => {
			const props: GroupProps = GroupDomainMapper.mapEntityToDomainObjectProperties(entity);

			return new Group(props);
		});

		return domainObjects;
	}

	public async findBySchoolIdAndGroupTypes(schoolId: EntityId, groupTypes?: GroupTypes[]): Promise<Group[]> {
		let groupEntityTypes: GroupEntityTypes[] | undefined;
		if (groupTypes) {
			groupEntityTypes = groupTypes.map((type: GroupTypes) => GroupTypesToGroupEntityTypesMapping[type]);
		}

		const scope: Scope<GroupEntity> = new GroupScope().byOrganizationId(schoolId).byTypes(groupEntityTypes);

		const entities: GroupEntity[] = await this.em.find(GroupEntity, scope.query);

		const domainObjects: Group[] = entities.map((entity) => {
			const props: GroupProps = GroupDomainMapper.mapEntityToDomainObjectProperties(entity);

			return new Group(props);
		});

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

		const domainObjects: Group[] = entities.map((entity) => {
			const props: GroupProps = GroupDomainMapper.mapEntityToDomainObjectProperties(entity);

			return new Group(props);
		});

		return domainObjects;
	}

	public async save(domainObject: Group): Promise<Group> {
		const entityProps: GroupEntityProps = GroupDomainMapper.mapDomainObjectToEntityProperties(domainObject, this.em);

		const newEntity: GroupEntity = new GroupEntity(entityProps);

		const existingEntity: GroupEntity | null = await this.em.findOne(GroupEntity, { id: domainObject.id });

		let savedEntity: GroupEntity;
		if (existingEntity) {
			savedEntity = this.em.assign(existingEntity, newEntity);
		} else {
			this.em.persist(newEntity);

			savedEntity = newEntity;
		}

		await this.em.flush();

		const savedProps: GroupProps = GroupDomainMapper.mapEntityToDomainObjectProperties(savedEntity);

		const savedDomainObject: Group = new Group(savedProps);

		return savedDomainObject;
	}

	public async delete(domainObject: Group): Promise<boolean> {
		const entity: GroupEntity | null = await this.em.findOne(GroupEntity, { id: domainObject.id });

		if (!entity) {
			return false;
		}

		await this.em.removeAndFlush(entity);

		return true;
	}
}

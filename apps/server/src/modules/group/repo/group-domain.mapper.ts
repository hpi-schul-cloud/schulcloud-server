import { EntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalSource } from '@shared/domain/domainobject';
import { ExternalSourceEntity, Role, SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import { Group, GroupProps, GroupTypes, GroupUser } from '../domain';
import { GroupEntity, GroupEntityTypes, GroupUserEntity, GroupValidPeriodEntity } from '../entity';

const GroupEntityTypesToGroupTypesMapping: Record<GroupEntityTypes, GroupTypes> = {
	[GroupEntityTypes.CLASS]: GroupTypes.CLASS,
	[GroupEntityTypes.COURSE]: GroupTypes.COURSE,
	[GroupEntityTypes.OTHER]: GroupTypes.OTHER,
};

export const GroupTypesToGroupEntityTypesMapping: Record<GroupTypes, GroupEntityTypes> = {
	[GroupTypes.CLASS]: GroupEntityTypes.CLASS,
	[GroupTypes.COURSE]: GroupEntityTypes.COURSE,
	[GroupTypes.OTHER]: GroupEntityTypes.OTHER,
};

export class GroupDomainMapper {
	static mapDoToEntityData(group: Group, em: EntityManager): EntityData<GroupEntity> {
		const props: GroupProps = group.getProps();

		let validPeriod: GroupValidPeriodEntity | undefined;
		if (props.validFrom && props.validUntil) {
			validPeriod = new GroupValidPeriodEntity({
				from: props.validFrom,
				until: props.validUntil,
			});
		}

		const groupEntityData: EntityData<GroupEntity> = {
			name: props.name,
			type: GroupTypesToGroupEntityTypesMapping[props.type],
			externalSource: props.externalSource
				? this.mapExternalSourceToExternalSourceEntity(props.externalSource, em)
				: undefined,
			users: props.users.map(
				(groupUser): GroupUserEntity => GroupDomainMapper.mapGroupUserToGroupUserEntity(groupUser, em)
			),
			validPeriod,
			organization: props.organizationId ? em.getReference(SchoolEntity, props.organizationId) : undefined,
		};

		return groupEntityData;
	}

	static mapEntityToDo(entity: GroupEntity): Group {
		const group: Group = new Group({
			id: entity.id,
			users: entity.users.map((groupUser): GroupUser => this.mapGroupUserEntityToGroupUser(groupUser)),
			validFrom: entity.validPeriod ? entity.validPeriod.from : undefined,
			validUntil: entity.validPeriod ? entity.validPeriod.until : undefined,
			externalSource: entity.externalSource
				? this.mapExternalSourceEntityToExternalSource(entity.externalSource)
				: undefined,
			type: GroupEntityTypesToGroupTypesMapping[entity.type],
			name: entity.name,
			organizationId: entity.organization?.id,
		});

		return group;
	}

	static mapExternalSourceToExternalSourceEntity(
		externalSource: ExternalSource,
		em: EntityManager
	): ExternalSourceEntity {
		const externalSourceEntity: ExternalSourceEntity = new ExternalSourceEntity({
			externalId: externalSource.externalId,
			system: em.getReference(SystemEntity, externalSource.systemId),
		});

		return externalSourceEntity;
	}

	static mapExternalSourceEntityToExternalSource(entity: ExternalSourceEntity): ExternalSource {
		const externalSource: ExternalSource = new ExternalSource({
			externalId: entity.externalId,
			systemId: entity.system.id,
		});

		return externalSource;
	}

	static mapGroupUserToGroupUserEntity(groupUser: GroupUser, em: EntityManager): GroupUserEntity {
		const groupUserEntity: GroupUserEntity = new GroupUserEntity({
			user: em.getReference(User, groupUser.userId),
			role: em.getReference(Role, groupUser.roleId),
		});

		return groupUserEntity;
	}

	static mapGroupUserEntityToGroupUser(entity: GroupUserEntity): GroupUser {
		const groupUser: GroupUser = new GroupUser({
			userId: entity.user.id,
			roleId: entity.role.id,
		});

		return groupUser;
	}
}

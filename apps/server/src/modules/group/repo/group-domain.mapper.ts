import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalSource, ExternalSourceEntity, Role, System, User } from '@shared/domain';
import { Group, GroupProps, GroupTypes, GroupUser } from '../domain';
import { GroupEntity, GroupEntityProps, GroupEntityTypes } from '../entity';
import { GroupUserEntity } from '../entity/group-user.entity';
import { GroupValidPeriodEntity } from '../entity/group-valid-period.entity';

const GroupEntityTypesToGroupTypesMapping: Record<GroupEntityTypes, GroupTypes> = {
	[GroupEntityTypes.CLASS]: GroupTypes.CLASS,
};

const GroupTypesToGroupEntityTypesMapping: Record<GroupTypes, GroupEntityTypes> = {
	[GroupTypes.CLASS]: GroupEntityTypes.CLASS,
};

export class GroupDomainMapper {
	static mapDomainObjectToEntityProperties(group: Group, em: EntityManager): GroupEntityProps {
		const props: GroupProps = group.getProps();

		const mapped: GroupEntityProps = {
			name: props.name,
			type: GroupTypesToGroupEntityTypesMapping[props.type],
			externalSource: props.externalSource
				? this.mapExternalSourceToExternalSourceEntity(props.externalSource, em)
				: undefined,
			users: props.users.map(
				(groupUser): GroupUserEntity => GroupDomainMapper.mapGroupUserToGroupUserEntity(groupUser, em)
			),
			validPeriod: new GroupValidPeriodEntity({
				until: props.validUntil,
				from: props.validFrom,
			}),
		};

		return mapped;
	}

	static mapEntityToDomainObjectProperties(entity: GroupEntity): GroupProps {
		const mapped: GroupProps = {
			id: entity.id,
			users: entity.users.map((groupUser): GroupUser => this.mapGroupUserEntityToGroupUser(groupUser)),
			validFrom: entity.validPeriod.from,
			validUntil: entity.validPeriod.until,
			externalSource: entity.externalSource
				? this.mapExternalSourceEntityToExternalSource(entity.externalSource)
				: undefined,
			type: GroupEntityTypesToGroupTypesMapping[entity.type],
			name: entity.name,
		};

		return mapped;
	}

	static mapExternalSourceToExternalSourceEntity(
		externalSource: ExternalSource,
		em: EntityManager
	): ExternalSourceEntity {
		const mapped = new ExternalSourceEntity({
			externalId: externalSource.externalId,
			system: em.getReference(System, externalSource.systemId),
		});

		return mapped;
	}

	static mapExternalSourceEntityToExternalSource(entity: ExternalSourceEntity): ExternalSource {
		const mapped = new ExternalSource({
			externalId: entity.externalId,
			systemId: entity.system.id,
		});

		return mapped;
	}

	static mapGroupUserToGroupUserEntity(groupUser: GroupUser, em: EntityManager): GroupUserEntity {
		const mapped = new GroupUserEntity({
			user: em.getReference(User, groupUser.userId),
			role: em.getReference(Role, groupUser.roleId),
		});

		return mapped;
	}

	static mapGroupUserEntityToGroupUser(entity: GroupUserEntity): GroupUser {
		const mapped = new GroupUser({
			userId: entity.user.id,
			roleId: entity.role.id,
		});

		return mapped;
	}
}

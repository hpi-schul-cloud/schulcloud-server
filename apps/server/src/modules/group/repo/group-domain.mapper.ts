import { EntityManager } from '@mikro-orm/mongodb';
import { ExternalSource } from '@shared/domain/domainobject/external-source';
import { ExternalSourceEntity } from '@shared/domain/entity/external-source.entity';
import { Role } from '@shared/domain/entity/role.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SystemEntity } from '@shared/domain/entity/system.entity';
import { User } from '@shared/domain/entity/user.entity';
import { Group, GroupProps } from '../domain/group';
import { GroupTypes } from '../domain/group-types';
import { GroupUser } from '../domain/group-user';
import { GroupUserEntity } from '../entity/group-user.entity';
import { GroupValidPeriodEntity } from '../entity/group-valid-period.entity';
import { GroupEntity, GroupEntityProps, GroupEntityTypes } from '../entity/group.entity';

const GroupEntityTypesToGroupTypesMapping: Record<GroupEntityTypes, GroupTypes> = {
	[GroupEntityTypes.CLASS]: GroupTypes.CLASS,
};

const GroupTypesToGroupEntityTypesMapping: Record<GroupTypes, GroupEntityTypes> = {
	[GroupTypes.CLASS]: GroupEntityTypes.CLASS,
};

export class GroupDomainMapper {
	static mapDomainObjectToEntityProperties(group: Group, em: EntityManager): GroupEntityProps {
		const props: GroupProps = group.getProps();

		let validPeriod: GroupValidPeriodEntity | undefined;
		if (props.validFrom && props.validUntil) {
			validPeriod = new GroupValidPeriodEntity({
				from: props.validFrom,
				until: props.validUntil,
			});
		}

		const mapped: GroupEntityProps = {
			id: props.id,
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

		return mapped;
	}

	static mapEntityToDomainObjectProperties(entity: GroupEntity): GroupProps {
		const mapped: GroupProps = {
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
		};

		return mapped;
	}

	static mapExternalSourceToExternalSourceEntity(
		externalSource: ExternalSource,
		em: EntityManager
	): ExternalSourceEntity {
		const mapped = new ExternalSourceEntity({
			externalId: externalSource.externalId,
			system: em.getReference(SystemEntity, externalSource.systemId),
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

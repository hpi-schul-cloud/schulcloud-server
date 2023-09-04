import { Embedded, Entity, Enum, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, ExternalSourceEntity } from '@shared/domain';
import { GroupUserEntity } from './group-user.entity';
import { GroupValidPeriodEntity } from './group-valid-period.entity';

export enum GroupEntityTypes {
	CLASS = 'class',
}

export interface GroupEntityProps {
	name: string;

	type: GroupEntityTypes;

	externalSource?: ExternalSourceEntity;

	validPeriod: GroupValidPeriodEntity;

	users: GroupUserEntity[];

	organizationId?: string;
}

@Entity({ tableName: 'groups' })
export class GroupEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Enum()
	type: GroupEntityTypes;

	@Embedded(() => ExternalSourceEntity, { nullable: true })
	externalSource?: ExternalSourceEntity;

	@Embedded(() => GroupValidPeriodEntity)
	validPeriod: GroupValidPeriodEntity;

	@Embedded(() => GroupUserEntity, { array: true })
	users: GroupUserEntity[];

	@Property({ nullable: true })
	organizationId?: string;

	constructor(props: GroupEntityProps) {
		super();
		this.name = props.name;
		this.type = props.type;
		this.externalSource = props.externalSource;
		this.validPeriod = props.validPeriod;
		this.users = props.users;
		this.organizationId = props.organizationId;
	}
}

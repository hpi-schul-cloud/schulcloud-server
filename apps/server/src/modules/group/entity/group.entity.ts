import { Embedded, Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { School } from '@shared/domain';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { ExternalSourceEntity } from '@shared/domain/entity/external-source.entity';
import { EntityId } from '@shared/domain/types';
import { GroupUserEntity } from './group-user.entity';
import { GroupValidPeriodEntity } from './group-valid-period.entity';

export enum GroupEntityTypes {
	CLASS = 'class',
}

export interface GroupEntityProps {
	id?: EntityId;

	name: string;

	type: GroupEntityTypes;

	externalSource?: ExternalSourceEntity;

	validPeriod: GroupValidPeriodEntity;

	users: GroupUserEntity[];

	organization?: School;
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

	@ManyToOne(() => School, { nullable: true })
	organization?: School;

	constructor(props: GroupEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.name = props.name;
		this.type = props.type;
		this.externalSource = props.externalSource;
		this.validPeriod = props.validPeriod;
		this.users = props.users;
		this.organization = props.organization;
	}
}

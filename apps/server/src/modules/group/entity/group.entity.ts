import { Embedded, Entity, Enum, Index, ManyToOne, Property } from '@mikro-orm/core';
import { SchoolEntity } from '@modules/school/repo';
import { ExternalSourceEmbeddable } from '@modules/system/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { EntityId } from '@shared/domain/types';
import { GroupUserEmbeddable } from './group-user.embeddable';
import { GroupValidPeriodEmbeddable } from './group-valid-period.embeddable';

export enum GroupEntityTypes {
	CLASS = 'class',
	COURSE = 'course',
	ROOM = 'room',
	OTHER = 'other',
}

export interface GroupEntityProps {
	id?: EntityId;

	name: string;

	type: GroupEntityTypes;

	externalSource?: ExternalSourceEmbeddable;

	validPeriod?: GroupValidPeriodEmbeddable;

	users: GroupUserEmbeddable[];

	organization?: SchoolEntity;
}

@Entity({ tableName: 'groups' })
export class GroupEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Index()
	@Enum()
	type: GroupEntityTypes;

	@Embedded(() => ExternalSourceEmbeddable, { nullable: true, object: true })
	externalSource?: ExternalSourceEmbeddable;

	@Embedded(() => GroupValidPeriodEmbeddable, { nullable: true })
	validPeriod?: GroupValidPeriodEmbeddable;

	@Index()
	@Embedded(() => GroupUserEmbeddable, { array: true })
	users: GroupUserEmbeddable[];

	@Index()
	@ManyToOne(() => SchoolEntity, { nullable: true })
	organization?: SchoolEntity;

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

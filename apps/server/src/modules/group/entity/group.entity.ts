import { Collection, Embedded, Entity, Enum, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { Course as CourseEntity } from '@shared/domain/entity';
import { BaseEntityWithTimestamps } from '@shared/domain/entity/base.entity';
import { ExternalSourceEntity } from '@shared/domain/entity/external-source.entity';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { EntityId } from '@shared/domain/types';
import { GroupUserEntity } from './group-user.entity';
import { GroupValidPeriodEntity } from './group-valid-period.entity';

export enum GroupEntityTypes {
	CLASS = 'class',
	COURSE = 'course',
	OTHER = 'other',
}

export interface GroupEntityProps {
	id?: EntityId;

	name: string;

	type: GroupEntityTypes;

	externalSource?: ExternalSourceEntity;

	validPeriod?: GroupValidPeriodEntity;

	users: GroupUserEntity[];

	organization?: SchoolEntity;
}

@Entity({ tableName: 'groups' })
export class GroupEntity extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Enum()
	type: GroupEntityTypes;

	@Embedded(() => ExternalSourceEntity, { nullable: true })
	externalSource?: ExternalSourceEntity;

	@Embedded(() => GroupValidPeriodEntity, { nullable: true })
	validPeriod?: GroupValidPeriodEntity;

	@Embedded(() => GroupUserEntity, { array: true })
	users: GroupUserEntity[];

	@ManyToOne(() => SchoolEntity, { nullable: true })
	organization?: SchoolEntity;

	@OneToMany(() => CourseEntity, (course: CourseEntity) => course.syncedWithGroup)
	syncedCourses: Collection<CourseEntity> = new Collection<CourseEntity>(this);

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

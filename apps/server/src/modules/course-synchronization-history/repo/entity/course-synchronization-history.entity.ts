import { Entity, Index, OneToOne, Property } from '@mikro-orm/core';
import { CourseEntity } from '@modules/course/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface CourseSynchronizationHistoryEntityProps {
	id?: EntityId;

	externalGroupId: string;

	synchronizedCourse: CourseEntity;

	expiresAt: Date;
}

@Entity({ tableName: 'course-synchronization-history' })
export class CourseSynchronizationHistoryEntity extends BaseEntityWithTimestamps {
	@Property()
	externalGroupId: string;

	@OneToOne(() => CourseEntity)
	synchronizedCourse: CourseEntity;

	@Index({ options: { expireAfterSeconds: 0 } })
	@Property()
	expiresAt: Date;

	constructor(props: CourseSynchronizationHistoryEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.externalGroupId = props.externalGroupId;
		this.synchronizedCourse = props.synchronizedCourse;
		this.expiresAt = props.expiresAt;
	}
}

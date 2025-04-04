import { Entity, Enum, Index, OneToOne, Property } from '@mikro-orm/core';
import { CourseEntity, SyncAttribute } from '@modules/course/repo';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface CourseSynchronizationHistoryEntityProps {
	id?: EntityId;

	externalGroupId: string;

	synchronizedCourse: CourseEntity;

	expiresAt: Date;

	excludeFromSync?: SyncAttribute[];
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

	@Enum({ nullable: true, array: true })
	excludeFromSync?: SyncAttribute[];

	constructor(props: CourseSynchronizationHistoryEntityProps) {
		super();
		if (props.id) {
			this.id = props.id;
		}
		this.externalGroupId = props.externalGroupId;
		this.synchronizedCourse = props.synchronizedCourse;
		this.expiresAt = props.expiresAt;
		if (props.excludeFromSync) {
			this.excludeFromSync = props.excludeFromSync;
		}
	}
}

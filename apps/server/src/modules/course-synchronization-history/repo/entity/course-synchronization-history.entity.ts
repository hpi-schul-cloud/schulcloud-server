import { Entity, Enum, Index, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseSyncAttribute } from '@modules/course';
import { BaseEntityWithTimestamps } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';

export interface CourseSynchronizationHistoryEntityProps {
	id?: EntityId;

	externalGroupId: string;

	synchronizedCourse: ObjectId;

	expiresAt: Date;

	excludeFromSync?: CourseSyncAttribute[];
}

@Entity({ tableName: 'course-synchronization-history' })
export class CourseSynchronizationHistoryEntity extends BaseEntityWithTimestamps {
	@Property()
	externalGroupId: string;

	synchronizedCourse: ObjectId;

	@Index({ options: { expireAfterSeconds: 0 } })
	@Property()
	expiresAt: Date;

	@Enum({ nullable: true, array: true })
	excludeFromSync?: CourseSyncAttribute[];

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

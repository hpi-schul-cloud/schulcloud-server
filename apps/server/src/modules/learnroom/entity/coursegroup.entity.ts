import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

export interface ICoursegroupProperties {
	courseId: EntityId;
	studentIds?: EntityId[];
}

@Entity({ tableName: 'coursegroups' })
export class Coursegroup extends BaseEntityWithTimestamps {
	@Property({ fieldName: 'userIds' })
	studentIds: EntityId[];

	// TODO: only id is needed at the moment
	// @ManyToOne({ fieldName: 'courseId' })
	// course: Course;
	@Property()
	courseId: EntityId;

	constructor(props: ICoursegroupProperties) {
		super();
		this.studentIds = props.studentIds || [];
		this.courseId = props.courseId;
		Object.assign(this, {});
	}

	// TODO: isMember vs isStudent
	isMember(userId: EntityId): boolean {
		const isStudent = this.studentIds.includes(userId);
		return isStudent;
	}

	getParentId(): EntityId {
		return this.courseId;
	}
}

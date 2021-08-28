import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityWithTimestamps } from '@shared/domain';

export interface ICoursegroupProperties {
	courseId: ObjectId;
	studentIds?: ObjectId[];
}

@Entity({ tableName: 'coursegroups' })
export class Coursegroup extends BaseEntityWithTimestamps {
	@Property({ fieldName: 'userIds' })
	studentIds: ObjectId[];

	@Property()
	courseId: ObjectId;

	constructor(props: ICoursegroupProperties) {
		super();
		this.studentIds = props.studentIds || [];
		this.courseId = props.courseId;
		Object.assign(this, {});
	}

	// TODO: isMember vs isStudent
	isMember(userId: ObjectId): boolean {
		const isStudent = this.studentIds.includes(userId);
		return isStudent;
	}

	getParentId(): ObjectId {
		return this.courseId;
	}
}

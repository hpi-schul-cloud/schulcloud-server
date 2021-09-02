// must deleted
import { Entity, Property } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';

import { BaseEntityWithTimestamps } from '@shared/domain';

interface LessonTaskInfoProperties {
	hidden?: boolean;
	courseId: ObjectId;
}

@Entity({ tableName: 'lessons' })
export class LessonTaskInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@Property()
	courseId: ObjectId;

	constructor(props: LessonTaskInfoProperties) {
		super();
		this.hidden = props.hidden || true;
		this.courseId = props.courseId;
		Object.assign(this, {});
	}
}

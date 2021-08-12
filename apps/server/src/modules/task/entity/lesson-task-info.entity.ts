import { Entity, Property } from '@mikro-orm/core';

import { BaseEntityWithTimestamps, EntityId } from '@shared/domain';

interface LessonTaskInfoProperties {
	hidden: boolean;
	courseId: EntityId;
}

@Entity({ tableName: 'lessons' })
export class LessonTaskInfo extends BaseEntityWithTimestamps {
	@Property()
	hidden: boolean;

	@Property()
	courseId: EntityId;

	constructor(props: LessonTaskInfoProperties) {
		super();
		this.hidden = props.hidden;
		this.courseId = props.courseId;
		Object.assign(this, {});
	}
}

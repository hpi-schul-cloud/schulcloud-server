/* istanbul ignore file */
// TODO add tests to improve coverage

import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';

interface FileTaskInfoProperties {
	name: string;
	creator: UserTaskInfo;
}

@Entity({ tableName: 'files' })
export class FileTaskInfo extends BaseEntityWithTimestamps {
	@Property()
	name: string;

	@Property()
	creator: UserTaskInfo;

	constructor(props: FileTaskInfoProperties) {
		super();
		this.name = props.name;
		this.creator = props.creator;
		Object.assign(this, {});
	}
}

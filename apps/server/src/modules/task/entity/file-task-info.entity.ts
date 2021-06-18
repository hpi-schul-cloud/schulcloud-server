import { Entity, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';

@Entity({ tableName: 'files' })
export class FileTaskInfo extends BaseEntityWithTimestamps {
	constructor(partial: Partial<FileTaskInfo>) {
		super();
		Object.assign(this, partial);
	}

	@Property()
	name: string;

	@Property()
	creator: UserTaskInfo;
}

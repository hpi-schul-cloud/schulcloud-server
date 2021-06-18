import { ObjectId } from '@mikro-orm/mongodb';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';
import { FileTaskInfo } from './file-task-info.entity';

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Submission>) {
		super();
		Object.assign(this, partial);
	}

	// TODO: adding task entity is not possible import circle and typescript before defined, maybe we must add a new task entity
	@Property()
	homeworkId: ObjectId;

	@ManyToOne({ fieldName: 'studentId' })
	student: UserTaskInfo;

	/* ***** student uploads ***** */
	@Property()
	comment: string;

	@Property()
	studentFiles: FileTaskInfo;

	/* ***** teacher uploads ***** */
	@Property()
	grade: number;

	@Property()
	gradeComment: string;

	@Property()
	gradeFileIds: FileTaskInfo;
}

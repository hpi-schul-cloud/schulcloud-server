import { Entity, ManyToOne, Collection, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';
import { FileTaskInfo } from './file-task-info.entity';
import { Task } from './task.entity';
import { CourseGroupInfo } from './course-group-info.entity';

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
	constructor(partial: Partial<Submission>) {
		super();
		Object.assign(this, partial);
	}

	@ManyToOne({ fieldName: 'homeworkId' })
	task: Task;

	@ManyToOne({ fieldName: 'studentId' })
	student: UserTaskInfo;

	@ManyToOne({ fieldName: 'courseGroupId' })
	courseGroup: CourseGroupInfo;

	@ManyToMany({ fieldName: 'teamMembers', type: UserTaskInfo })
	teamMembers = new Collection<UserTaskInfo>(this);

	/* ***** student uploads ***** */
	@Property()
	comment: string;

	@ManyToMany({ fieldName: 'fileIds', type: FileTaskInfo })
	studentFiles = new Collection<FileTaskInfo>(this);

	/* ***** teacher uploads ***** */
	@Property()
	grade: number;

	@Property()
	gradeComment: string;

	@ManyToMany({ fieldName: 'gradeFileIds', type: FileTaskInfo })
	gradeFileIds = new Collection<FileTaskInfo>(this);
}

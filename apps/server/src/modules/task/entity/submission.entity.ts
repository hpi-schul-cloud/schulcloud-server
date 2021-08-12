import { Entity, ManyToOne, Collection, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from '@shared/domain';
import { UserTaskInfo } from './user-task-info.entity';
import { FileTaskInfo } from './file-task-info.entity';
import { Task } from './task.entity';
import { CourseGroupInfo } from './course-group-info.entity';

interface ISubmissionProperties {
	task: Task;
	student: UserTaskInfo;
	courseGroup?: CourseGroupInfo[];
	teamMembers?: UserTaskInfo[];
	comment: string;
	studentFiles?: FileTaskInfo[];
	grade?: number;
	gradeComment?: string;
	gradeFile?: FileTaskInfo[];
}

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
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
	comment: string | null;

	@ManyToMany({ fieldName: 'fileIds', type: FileTaskInfo })
	studentFiles = new Collection<FileTaskInfo>(this);

	/* ***** teacher uploads ***** */
	@Property()
	grade: number | null;

	@Property()
	gradeComment: string | null;

	@ManyToMany({ fieldName: 'gradeFileIds', type: FileTaskInfo })
	gradeFile = new Collection<FileTaskInfo>(this);

	constructor(props: ISubmissionProperties) {
		super();
		this.student = props.student;
		this.comment = props.comment;
		this.task = props.task;

		this.grade = props.grade || null;
		this.gradeComment = props.gradeComment || null;

		const { courseGroup, teamMembers, studentFiles, gradeFile } = props;
		Object.assign(this, { courseGroup, teamMembers, studentFiles, gradeFile });
	}
}

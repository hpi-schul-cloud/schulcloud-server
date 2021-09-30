import { Entity, ManyToOne, Collection, Property, ManyToMany } from '@mikro-orm/core';
import { BaseEntityWithTimestamps } from './base.entity';
import type { CourseGroup } from './coursegroup.entity';
import type { User } from './user.entity';
import type { File } from './file.entity';
import type { Task } from './task.entity';

interface ISubmissionProperties {
	task: Task;
	student: User;
	courseGroup?: CourseGroup[];
	teamMembers?: User[];
	comment: string;
	studentFiles?: File[];
	grade?: number;
	gradeComment?: string;
	gradeFiles?: File[];
}

@Entity({ tableName: 'submissions' })
export class Submission extends BaseEntityWithTimestamps {
	@ManyToOne('Task', { fieldName: 'homeworkId' })
	task: Task;

	@ManyToOne('User', { fieldName: 'studentId' })
	student: User;

	@ManyToOne('CourseGroup', { fieldName: 'courseGroupId' })
	courseGroup?: CourseGroup;

	@ManyToMany('User', undefined, { fieldName: 'teamMembers' })
	teamMembers = new Collection<User>(this);

	/* ***** student uploads ***** */
	@Property()
	comment: string | null;

	@ManyToMany('File', undefined, { fieldName: 'fileIds' })
	studentFiles = new Collection<File>(this);

	/* ***** teacher uploads ***** */
	@Property()
	grade: number | null;

	@Property()
	gradeComment: string | null;

	@ManyToMany('File', undefined, { fieldName: 'gradeFileIds' })
	gradeFiles = new Collection<File>(this);

	isGraded(): boolean {
		const isGraded =
			(typeof this.grade === 'number' && this.grade >= 0) ||
			(typeof this.gradeComment === 'string' && this.gradeComment.length > 0) ||
			(this.gradeFiles !== undefined && this.gradeFiles.length > 0);
		return isGraded;
	}

	constructor(props: ISubmissionProperties) {
		super();
		this.student = props.student;
		this.comment = props.comment;
		this.task = props.task;

		this.grade = props.grade || null;
		this.gradeComment = props.gradeComment || null;

		const { courseGroup, teamMembers, studentFiles, gradeFiles } = props;
		Object.assign(this, { courseGroup, teamMembers, studentFiles, gradeFiles });
	}
}

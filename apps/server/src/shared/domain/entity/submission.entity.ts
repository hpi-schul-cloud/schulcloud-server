import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';

import { EntityId } from '../types';

import { BaseEntityWithTimestamps } from './base.entity';
import type { CourseGroup } from './coursegroup.entity';
import type { File } from './file.entity';
import type { Task } from './task.entity';
import type { User } from './user.entity';

export interface ISubmissionProperties {
	task: Task;
	student: User;
	courseGroup?: CourseGroup;
	teamMembers?: User[];
	comment: string;
	studentFiles?: File[];
	submitted?: boolean;
	graded?: boolean;
	grade?: number;
	gradeComment?: string;
	gradeFiles?: File[];
}

@Entity({ tableName: 'submissions' })
@Index({ properties: ['student', 'teamMembers'] })
export class Submission extends BaseEntityWithTimestamps {
	@ManyToOne('Task', { fieldName: 'homeworkId' })
	@Index()
	task: Task;

	@ManyToOne('User', { fieldName: 'studentId' })
	student: User;

	@ManyToOne('CourseGroup', { fieldName: 'courseGroupId', nullable: true })
	courseGroup?: CourseGroup;

	@ManyToMany('User', undefined, { fieldName: 'teamMembers' })
	teamMembers = new Collection<User>(this);

	/* ***** student uploads ***** */
	@Property({ nullable: true })
	comment?: string;

	@ManyToMany('File', undefined, { fieldName: 'fileIds' })
	@Index()
	studentFiles = new Collection<File>(this);

	@Property()
	submitted: boolean;

	/* ***** teacher uploads ***** */
	@Property()
	graded: boolean;

	@Property({ nullable: true })
	grade?: number;

	@Property({ nullable: true })
	gradeComment?: string;

	@ManyToMany('File', undefined, { fieldName: 'gradeFileIds' })
	@Index()
	gradeFiles = new Collection<File>(this);

	constructor(props: ISubmissionProperties) {
		super();
		this.student = props.student;
		this.comment = props.comment;
		this.task = props.task;
		this.submitted = props.submitted || false;
		this.graded = props.graded || false;
		this.grade = props.grade;
		this.gradeComment = props.gradeComment;
		this.courseGroup = props.courseGroup;

		if (props.teamMembers !== undefined) {
			this.teamMembers.set(props.teamMembers);
		}
		if (props.studentFiles !== undefined) {
			this.studentFiles.set(props.studentFiles);
		}
		if (props.gradeFiles !== undefined) {
			this.gradeFiles.set(props.gradeFiles);
		}
	}

	isGraded(): boolean {
		const isGraded =
			(typeof this.grade === 'number' && this.grade >= 0) ||
			(typeof this.gradeComment === 'string' && this.gradeComment.length > 0) ||
			(this.gradeFiles !== undefined && this.gradeFiles.length > 0);
		return isGraded;
	}

	getStudentId(): EntityId {
		return this.student.id;
	}
}

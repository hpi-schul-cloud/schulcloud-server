import { Collection, Entity, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core';

import { InternalServerErrorException } from '@nestjs/common';
import { BaseEntityWithTimestamps } from './base.entity';
import type { CourseGroup } from './coursegroup.entity';
import type { File } from './file.entity';
import type { Task } from './task.entity';
import { EntityId } from '../types';
import type { User } from './user.entity';

export interface ISubmissionProperties {
	task: Task;
	student: User;
	courseGroup?: CourseGroup;
	teamMembers?: User[];
	comment: string;
	studentFiles?: File[];
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

	/* ***** teacher uploads ***** */
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

	private getCourseGroupStudentIds(): EntityId[] {
		let courseGroupMemberIds: EntityId[] = [];

		if (this.courseGroup) {
			courseGroupMemberIds = this.courseGroup.getStudentIds();
		}

		return courseGroupMemberIds;
	}

	private getTeamMemberIds(): EntityId[] {
		if (!this.teamMembers) {
			throw new InternalServerErrorException(
				'Submission.teamMembers is undefined. The submission need to be populated.'
			);
		}

		const teamMemberObjectIds = this.teamMembers.getIdentifiers('_id');
		const teamMemberIds = teamMemberObjectIds.map((id): string => id.toString());

		return teamMemberIds;
	}

	private getGradeFileIds(): EntityId[] {
		const gradeFilesObjectIds = this.gradeFiles.getIdentifiers('_id');
		const gradeFilesIds = gradeFilesObjectIds.map((id): string => id.toString());

		return gradeFilesIds;
	}

	private hasGrade(): boolean {
		const gradeExists = typeof this.grade === 'number' && this.grade >= 0;

		return gradeExists;
	}

	private hasGradeComment(): boolean {
		const gradeCommentExists = typeof this.gradeComment === 'string' && this.gradeComment.length > 0;

		return gradeCommentExists;
	}

	private hasGradeFiles(): boolean {
		const gradedFileIds = this.getGradeFileIds();
		const gradeFilesExists = gradedFileIds.length > 0;

		return gradeFilesExists;
	}

	public isSubmitted(): boolean {
		// Always submitted for now, but can be changed in future.
		const isSubmitted = true;

		return isSubmitted;
	}

	public isSubmittedForUser(user: User): boolean {
		const isMember = this.isUserSubmitter(user);
		const isSubmitted = this.isSubmitted();
		const isSubmittedForUser = isMember && isSubmitted;

		return isSubmittedForUser;
	}

	// Bad that the logic is needed to expose the userIds, but is used in task for now.
	// Check later if it can be replaced and remove all related code.
	public getSubmitterIds(): EntityId[] {
		const creatorId = this.student.id;
		const teamMemberIds = this.getTeamMemberIds();
		const courseGroupMemberIds = this.getCourseGroupStudentIds();
		const memberIds = [creatorId, ...teamMemberIds, ...courseGroupMemberIds];

		const uniqueMemberIds = [...new Set(memberIds)];

		return uniqueMemberIds;
	}

	public isUserSubmitter(user: User): boolean {
		const memberIds = this.getSubmitterIds();
		const isMember = memberIds.some((id) => id === user.id);

		return isMember;
	}

	public isGraded(): boolean {
		const isGraded = this.hasGrade() || this.hasGradeComment() || this.hasGradeFiles();

		return isGraded;
	}

	public isGradedForUser(user: User): boolean {
		const isMember = this.isUserSubmitter(user);
		const isGraded = this.isGraded();
		const isGradedForUser = isMember && isGraded;

		return isGradedForUser;
	}
}

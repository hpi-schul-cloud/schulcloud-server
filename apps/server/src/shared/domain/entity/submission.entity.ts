import { Collection, Entity, Index, ManyToMany, ManyToOne, Property, Unique } from '@mikro-orm/core';

import { InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '../types';
import { BaseEntityWithTimestamps } from './base.entity';
import type { CourseGroup } from './coursegroup.entity';
import { SchoolEntity } from './school.entity';
import type { Task } from './task.entity';
import type { User } from './user.entity';

export interface SubmissionProperties {
	school: SchoolEntity;
	task: Task;
	student?: User;
	courseGroup?: CourseGroup;
	teamMembers?: User[];
	comment: string;
	submitted?: boolean;
	graded?: boolean;
	grade?: number;
	gradeComment?: string;
}

@Entity({ tableName: 'submissions' })
@Index({ properties: ['student', 'teamMembers'] })
@Unique({ properties: ['student', 'task'] })
export class Submission extends BaseEntityWithTimestamps {
	@ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	@Index()
	school: SchoolEntity;

	@ManyToOne('Task', { fieldName: 'homeworkId' })
	@Index()
	task: Task;

	@ManyToOne('User', { fieldName: 'studentId', nullable: true })
	student?: User;

	@ManyToOne('CourseGroup', { fieldName: 'courseGroupId', nullable: true })
	courseGroup?: CourseGroup;

	@ManyToMany('User', undefined, { fieldName: 'teamMembers' })
	teamMembers = new Collection<User>(this);

	@Property({ nullable: true })
	comment?: string;

	@Property()
	submitted: boolean;

	@Property()
	graded: boolean;

	@Property({ nullable: true })
	grade?: number;

	@Property({ nullable: true })
	gradeComment?: string;

	constructor(props: SubmissionProperties) {
		super();
		this.school = props.school;
		if (props.student !== undefined) {
			this.student = props.student;
		}
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

	public isSubmitted(): boolean {
		return this.submitted;
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
		const creatorId = this.student?.id;
		const teamMemberIds = this.getTeamMemberIds();
		const courseGroupMemberIds = this.getCourseGroupStudentIds();
		const memberIds =
			creatorId !== undefined
				? [creatorId, ...teamMemberIds, ...courseGroupMemberIds]
				: [...teamMemberIds, ...courseGroupMemberIds];

		const uniqueMemberIds = [...new Set(memberIds)];

		return uniqueMemberIds;
	}

	public isUserSubmitter(user: User): boolean {
		const memberIds = this.getSubmitterIds();
		const isMember = memberIds.some((id) => id === user.id);

		return isMember;
	}

	public isGraded(): boolean {
		return this.graded;
	}

	public isGradedForUser(user: User): boolean {
		const isMember = this.isUserSubmitter(user);
		const isGraded = this.isGraded();
		const isGradedForUser = isMember && isGraded;

		return isGradedForUser;
	}

	public isGroupSubmission(): boolean {
		return this.hasCourseGroup() || (!this.hasCourseGroup() && this.teamMembers.length > 1);
	}

	public isSingleSubmissionOwnedByUser(): boolean {
		return !this.hasCourseGroup() && this.teamMembers.length === 1;
	}

	private hasCourseGroup(): boolean {
		return !!this.courseGroup;
	}

	public removeStudentById(userId: EntityId): void {
		if (userId === this.student?.id) {
			this.student = undefined;
		}
	}

	public removeUserFromTeamMembers(userId: EntityId): void {
		const modifiedArray = this.teamMembers.getItems().filter((user) => user.id !== userId);

		this.teamMembers.set(modifiedArray);
	}
}

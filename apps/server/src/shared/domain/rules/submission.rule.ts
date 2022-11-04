import { Injectable } from '@nestjs/common';
import { Submission, User } from '../entity';
import { IPermissionContext, PermissionTypes } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
import { CourseGroupRule } from './course-group.rule';
import { TaskRule } from './task.rule';

@Injectable()
export class SubmissionRule extends BasePermission<Submission> {
	constructor(private readonly taskRule: TaskRule, private readonly courseGroupRule: CourseGroupRule) {
		super();
	}

	public isApplicable(user: User, entity: PermissionTypes): boolean {
		const isMatched = entity instanceof Submission;

		return isMatched;
	}

	public hasPermission(user: User, submission: Submission, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasGeneralPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const hasSpecificPermission = this.hasSpecificPermission(user, submission, action);

		const result = hasGeneralPermission && hasSpecificPermission;

		return result;
	}

	private hasSpecificPermission(user: User, submission: Submission, action: Actions): boolean {
		const hasSpecificPermission =
			this.isCreator(user, submission) ||
			this.isTeamMember(user, submission) ||
			this.isInCourseGroup(user, submission) ||
			this.hasParentTaskWritePermission(user, submission) ||
			(action === Actions.read &&
				this.hasParentTaskReadPermission(user, submission) &&
				!!submission.task.publicSubmissions);

		return hasSpecificPermission;
	}

	private isCreator(user: User, submission: Submission) {
		const isCreator = this.utils.hasAccessToEntity(user, submission, ['student']);
		return isCreator;
	}

	private isTeamMember(user: User, submission: Submission) {
		const isTeamMember = this.utils.hasAccessToEntity(user, submission, ['teamMembers']);
		return isTeamMember;
	}

	private isInCourseGroup(user: User, submission: Submission) {
		const isInCourseGroup =
			submission.courseGroup &&
			this.courseGroupRule.hasPermission(user, submission.courseGroup, {
				action: Actions.read,
				requiredPermissions: [],
			});
		return isInCourseGroup;
	}

	private hasParentTaskWritePermission(user: User, submission: Submission) {
		const hasParentPermission = this.taskRule.hasPermission(user, submission.task, {
			action: Actions.write,
			requiredPermissions: [],
		});
		return hasParentPermission;
	}

	private hasParentTaskReadPermission(user: User, submission: Submission) {
		const hasParentPermission = this.taskRule.hasPermission(user, submission.task, {
			action: Actions.read,
			requiredPermissions: [],
		});
		return hasParentPermission;
	}
}

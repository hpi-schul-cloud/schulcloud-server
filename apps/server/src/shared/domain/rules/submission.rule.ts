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

		const result =
			this.utils.hasAllPermissions(user, requiredPermissions) && this.hasAccessToSubmission(user, submission, action);

		return result;
	}

	private hasAccessToSubmission(user: User, submission: Submission, action: Actions): boolean {
		let hasAccessToSubmission = false;

		if (action === Actions.write) {
			hasAccessToSubmission = this.hasWriteAccess(user, submission);
		} else if (action === Actions.read) {
			hasAccessToSubmission = this.hasReadAccess(user, submission);
		}

		return hasAccessToSubmission;
	}

	private hasWriteAccess(user: User, submission: Submission) {
		const hasWriteAccess = submission.isUserSubmitter(user) || this.hasParentTaskWriteAccess(user, submission);

		return hasWriteAccess;
	}

	private hasReadAccess(user: User, submission: Submission) {
		const hasReadAccess =
			this.hasWriteAccess(user, submission) ||
			(this.hasParentTaskReadAccess(user, submission) && submission.task.areSubmissionsPublic());

		return hasReadAccess;
	}

	private hasParentTaskWriteAccess(user: User, submission: Submission) {
		const hasParentTaskWriteAccess = this.taskRule.hasPermission(user, submission.task, {
			action: Actions.write,
			requiredPermissions: [],
		});

		return hasParentTaskWriteAccess;
	}

	private hasParentTaskReadAccess(user: User, submission: Submission) {
		const hasParentTaskReadAccess = this.taskRule.hasPermission(user, submission.task, {
			action: Actions.read,
			requiredPermissions: [],
		});

		return hasParentTaskReadAccess;
	}
}

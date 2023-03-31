import { Injectable } from '@nestjs/common';
import { Submission, User } from '../entity';
import { AuthorizableObject, AuthorizationContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { AuthorizationHelper } from './authorization.helper';
import { TaskRule } from './task.rule';

@Injectable()
export class SubmissionRule {
	constructor(private readonly authorizationHelper: AuthorizationHelper, private readonly taskRule: TaskRule) {}

	public isApplicable(user: User, entity: AuthorizableObject): boolean {
		const isMatched = entity instanceof Submission;

		return isMatched;
	}

	public hasPermission(user: User, submission: Submission, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;

		const result =
			this.authorizationHelper.hasAllPermissions(user, requiredPermissions) &&
			this.hasAccessToSubmission(user, submission, action);

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
		let hasReadAccess = false;

		if (submission.isSubmitted()) {
			hasReadAccess =
				this.hasWriteAccess(user, submission) ||
				(this.hasParentTaskReadAccess(user, submission) && submission.task.areSubmissionsPublic());
		} else {
			hasReadAccess = submission.isUserSubmitter(user);
		}

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

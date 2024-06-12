import { Injectable, NotImplementedException } from '@nestjs/common';
import { Submission, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { Action, AuthorizationContext, Rule } from '../type';
import { TaskRule } from './task.rule';

@Injectable()
export class SubmissionRule implements Rule<Submission> {
	constructor(private readonly authorizationHelper: AuthorizationHelper, private readonly taskRule: TaskRule) {}

	public isApplicable(user: User, object: unknown): boolean {
		const isMatched = object instanceof Submission;

		return isMatched;
	}

	public hasPermission(user: User, submission: Submission, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;

		const result =
			this.authorizationHelper.hasAllPermissions(user, requiredPermissions) &&
			this.hasAccessToSubmission(user, submission, action);

		return result;
	}

	private hasAccessToSubmission(user: User, submission: Submission, action: Action): boolean {
		let hasAccessToSubmission = false;

		if (action === Action.write) {
			hasAccessToSubmission = this.hasWriteAccess(user, submission);
		} else if (action === Action.read) {
			hasAccessToSubmission = this.hasReadAccess(user, submission);
		} else {
			throw new NotImplementedException('Action is not supported.');
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
			action: Action.write,
			requiredPermissions: [],
		});

		return hasParentTaskWriteAccess;
	}

	private hasParentTaskReadAccess(user: User, submission: Submission) {
		const hasParentTaskReadAccess = this.taskRule.hasPermission(user, submission.task, {
			action: Action.read,
			requiredPermissions: [],
		});

		return hasParentTaskReadAccess;
	}
}

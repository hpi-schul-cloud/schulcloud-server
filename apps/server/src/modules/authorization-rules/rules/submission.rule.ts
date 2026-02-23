import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { Submission } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { TaskRule } from './task.rule';

@Injectable()
export class SubmissionRule implements Rule<Submission> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		private readonly taskRule: TaskRule,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

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

	private hasWriteAccess(user: User, submission: Submission): boolean {
		const hasWriteAccess =
			(submission.isUserSubmitter(user) && this.isDueDatePendingOrUndefined(submission)) ||
			this.hasParentTaskWriteAccess(user, submission);

		return hasWriteAccess;
	}

	private hasReadAccess(user: User, submission: Submission): boolean {
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

	private hasParentTaskWriteAccess(user: User, submission: Submission): boolean {
		const hasParentTaskWriteAccess = this.taskRule.hasPermission(user, submission.task, {
			action: Action.write,
			requiredPermissions: [],
		});

		return hasParentTaskWriteAccess;
	}

	private hasParentTaskReadAccess(user: User, submission: Submission): boolean {
		const hasParentTaskReadAccess = this.taskRule.hasPermission(user, submission.task, {
			action: Action.read,
			requiredPermissions: [],
		});

		return hasParentTaskReadAccess;
	}

	private isDueDatePendingOrUndefined(submission: Submission): boolean {
		const { dueDate } = submission.task;
		const now = new Date();

		return dueDate === undefined || dueDate > now;
	}
}

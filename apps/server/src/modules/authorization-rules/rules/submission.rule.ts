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
import { Permission } from '@shared/domain/interface';

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
		let hasPermission = false;

		if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, submission, context);
		} else if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, submission, context);
		} else {
			throw new NotImplementedException('Action is not supported.');
		}

		return hasPermission;
	}

	private hasWriteAccess(user: User, submission: Submission, context: AuthorizationContext): boolean {
		// Permission is missing
		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return (
			hasInstanceWriteOperationPermission ||
			this.hasSubmissionWriteAccess(user, submission, context) ||
			this.hasParentTaskWriteAccess(user, submission)
		);
	}

	private hasReadAccess(user: User, submission: Submission, context: AuthorizationContext): boolean {
		// Permission is missing
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || this.hasSubmissionReadAccess(user, submission, context);
	}

	private hasSubmissionWriteAccess(user: User, submission: Submission, context: AuthorizationContext): boolean {
		// Permission is missing
		const hasWritePermissions = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		const isUserSubmitter = submission.isUserSubmitter(user);
		const isDueDatePendingOrUndefined = this.isDueDatePendingOrUndefined(submission);

		return hasWritePermissions && isUserSubmitter && isDueDatePendingOrUndefined;
	}

	private hasSubmissionReadAccess(user: User, submission: Submission, context: AuthorizationContext): boolean {
		// Permission is missing
		const hasReadPermissions = this.authorizationHelper.hasAllPermissions(user, context.requiredPermissions);
		let hasReadAccess = false;

		if (submission.isSubmitted()) {
			hasReadAccess =
				this.hasWriteAccess(user, submission, context) ||
				this.hasParentTaskReadAccess(user, submission) ||
				submission.isUserSubmitter(user);
		} else {
			hasReadAccess = submission.isUserSubmitter(user);
		}

		return hasReadPermissions && hasReadAccess;
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

		return hasParentTaskReadAccess && submission.task.areSubmissionsPublic();
	}

	private isDueDatePendingOrUndefined(submission: Submission): boolean {
		const { dueDate } = submission.task;
		const now = new Date();

		return dueDate === undefined || dueDate === null || dueDate > now;
	}
}

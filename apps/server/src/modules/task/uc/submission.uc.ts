import { Injectable } from '@nestjs/common';
import { EntityId, Permission, PermissionContextBuilder, Submission, User } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { SubmissionService } from '../service/submission.service';

@Injectable()
export class SubmissionUc {
	constructor(
		private readonly submissionService: SubmissionService,
		private readonly authorizationService: AuthorizationService
	) {}

	async findAllByTask(userId: EntityId, taskId: EntityId): Promise<Submission[]> {
		const [submissions] = await this.submissionService.findAllByTask(taskId);
		const user = await this.authorizationService.getUserWithPermissions(userId);

		const permittedSubmissions = this.filterSubmissionsByPermission(submissions, user);

		return permittedSubmissions;
	}

	private filterSubmissionsByPermission(submissions: Submission[], user: User): Submission[] {
		const permissionContext = PermissionContextBuilder.read([Permission.SUBMISSIONS_VIEW]);

		const permittedSubmissions = submissions.filter((submission) => {
			const hasPermission = this.authorizationService.hasPermission(user, submission, permissionContext);

			return hasPermission;
		});

		return permittedSubmissions;
	}
}

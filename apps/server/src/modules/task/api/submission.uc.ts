import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { SubmissionService } from '../domain';
import { Submission } from '../repo';

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

	async delete(userId: EntityId, submissionId: EntityId) {
		const [user, submission] = await Promise.all([
			this.authorizationService.getUserWithPermissions(userId),
			this.submissionService.findById(submissionId),
		]);

		this.authorizationService.checkPermission(
			user,
			submission,
			AuthorizationContextBuilder.write([Permission.SUBMISSIONS_EDIT])
		);

		await this.submissionService.delete(submission);

		return true;
	}

	private filterSubmissionsByPermission(submissions: Submission[], user: User): Submission[] {
		const permissionContext = AuthorizationContextBuilder.read([Permission.SUBMISSIONS_VIEW]);

		const permittedSubmissions = submissions.filter((submission) => {
			const hasPermission = this.authorizationService.hasPermission(user, submission, permissionContext);

			return hasPermission;
		});

		return permittedSubmissions;
	}
}

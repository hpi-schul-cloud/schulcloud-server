import { Injectable } from '@nestjs/common';
import { Submission } from '@shared/domain/entity/submission.entity';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
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

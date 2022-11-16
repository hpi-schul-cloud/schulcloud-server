import { Injectable } from '@nestjs/common';
import { Counted, EntityId, Permission, PermissionContextBuilder, Submission } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { SubmissionService } from '../service/submission.service';

@Injectable()
export class SubmissionUC {
	constructor(
		private readonly submissionService: SubmissionService,
		private readonly authorizationService: AuthorizationService
	) {}

	private async hasPermission(submission: Submission, userId: EntityId): Promise<boolean> {
		const permissionsContext = PermissionContextBuilder.read([Permission.SUBMISSIONS_VIEW]);

		const hasPermission = await this.authorizationService.hasPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.Submission,
			submission.id,
			permissionsContext
		);

		return hasPermission;
	}

	private async filterSubmissionsByPermission(submissions: Submission[], userId: EntityId): Promise<Submission[]> {
		const promises = submissions.map(async (submission) => this.hasPermission(submission, userId));

		const permittedIndexes = await Promise.all(promises);

		const permittedSubmissions = submissions.filter((submission, i) => permittedIndexes[i]);

		return permittedSubmissions;
	}

	async findAllByTask(userId: EntityId, taskId: EntityId): Promise<Counted<Submission[]>> {
		const [submissions] = await this.submissionService.findAllByTask(taskId);

		const permittedSubmissions = await this.filterSubmissionsByPermission(submissions, userId);

		return [permittedSubmissions, permittedSubmissions.length];
	}
}

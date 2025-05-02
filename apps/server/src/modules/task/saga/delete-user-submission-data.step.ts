import { Logger } from '@core/logger';
import {
	ModuleName,
	SagaService,
	SagaStep,
	StepOperationReport,
	StepOperationReportBuilder,
	StepOperationType,
	StepReport,
	StepReportBuilder,
	StepStatus,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Submission, SubmissionRepo } from '../repo';

@Injectable()
export class DeleteUserSubmissionDataStep extends SagaStep<'deleteUserData'> {
	constructor(
		private readonly sagaService: SagaService,
		private readonly submissionRepo: SubmissionRepo,
		private readonly logger: Logger
	) {
		super('deleteUserData');
		this.logger.setContext(DeleteUserSubmissionDataStep.name);
		this.sagaService.registerStep(ModuleName.TASK_SUBMISSION, this);
	}

	public async execute(params: { userId: EntityId }): Promise<StepReport> {
		const { userId } = params;

		const [submissionsDeleted, submissionsModified] = await Promise.all([
			this.deleteSingleSubmissionsOwnedByUser(userId),
			this.removeUserReferencesFromSubmissions(userId),
		]);

		const result = StepReportBuilder.build(ModuleName.TASK_SUBMISSION, [submissionsDeleted, submissionsModified]);

		return result;
	}

	public async deleteSingleSubmissionsOwnedByUser(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting single Submissions owned by user',
				ModuleName.TASK_SUBMISSION,
				userId,
				StepStatus.PENDING
			)
		);
		let [submissionsEntities, submissionsCount] = await this.submissionRepo.findAllByUserId(userId);

		if (submissionsCount > 0) {
			submissionsEntities = submissionsEntities.filter((submission) => submission.isSingleSubmissionOwnedByUser());
			submissionsCount = submissionsEntities.length;
		}

		if (submissionsCount > 0) {
			await this.submissionRepo.delete(submissionsEntities);
		}

		const result = StepOperationReportBuilder.build(
			StepOperationType.DELETE,
			submissionsCount,
			this.getSubmissionsId(submissionsEntities)
		);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted single Submissions owned by user',
				ModuleName.TASK_SUBMISSION,
				userId,
				StepStatus.FINISHED,
				submissionsCount,
				0
			)
		);

		return result;
	}

	public async removeUserReferencesFromSubmissions(userId: EntityId): Promise<StepOperationReport> {
		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Deleting user references from Submissions',
				ModuleName.TASK_SUBMISSION,
				userId,
				StepStatus.PENDING
			)
		);

		const [submissionsEntities, submissionsCount] = await this.submissionRepo.findAllByUserId(userId);

		if (submissionsCount <= 0) {
			this.logger.info(
				new UserDeletionStepOperationLoggable(
					'no references from Submissions found',
					ModuleName.TASK_SUBMISSION,
					userId,
					StepStatus.FINISHED,
					0,
					0
				)
			);

			const result = StepOperationReportBuilder.build(StepOperationType.UPDATE, 0, []);

			return result;
		}

		const submissionsIds = this.getSubmissionsId(
			submissionsEntities.filter((submission) => submission.isGroupSubmission())
		);

		const groupSubmissionsCount = submissionsIds.length;

		await this.submissionRepo.removeUserReference(submissionsIds);
		await this.submissionRepo.deleteUserFromGroupSubmissions(userId);

		const result = StepOperationReportBuilder.build(StepOperationType.UPDATE, groupSubmissionsCount, submissionsIds);

		this.logger.info(
			new UserDeletionStepOperationLoggable(
				'Successfully deleted references from Submissions collection',
				ModuleName.TASK_SUBMISSION,
				userId,
				StepStatus.FINISHED,
				groupSubmissionsCount,
				0
			)
		);
		return result;
	}

	private getSubmissionsId(submissions: Submission[]): EntityId[] {
		return submissions.map((submission) => submission.id);
	}
}

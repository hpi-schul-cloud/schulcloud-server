import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { IEventHandler, EventBus } from '@nestjs/cqrs';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { Submission } from '@shared/domain/entity';
import { DeletionService, DomainDeletionReport, DomainOperationReport } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { SubmissionRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { UserDeletedEvent, DataDeletedEvent } from '@src/modules/deletion/event';

@Injectable()
export class SubmissionService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private readonly submissionRepo: SubmissionRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: Logger,
		private readonly eventBus: EventBus
	) {}

	async handle({ deletionRequest }: UserDeletedEvent) {
		const dataDeleted = await this.deleteUserData(deletionRequest.targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequest, dataDeleted));
	}

	async findById(submissionId: EntityId): Promise<Submission> {
		return this.submissionRepo.findById(submissionId);
	}

	async findAllByTask(taskId: EntityId): Promise<Counted<Submission[]>> {
		const submissions = this.submissionRepo.findAllByTaskIds([taskId]);

		return submissions;
	}

	async delete(submission: Submission): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(submission.id);

		await this.submissionRepo.delete(submission);
	}

	async deleteUserData(userId: EntityId): Promise<DomainDeletionReport> {
		const [submissionsDeleted, submissionsModified] = await Promise.all([
			this.deleteSingleSubmissionsOwnedByUser(userId),
			this.removeUserReferencesFromSubmissions(userId),
		]);

		const result = DomainDeletionReportBuilder.build(DomainName.SUBMISSIONS, [submissionsDeleted, submissionsModified]);

		return result;
	}

	async deleteSingleSubmissionsOwnedByUser(userId: EntityId): Promise<DomainOperationReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting single Submissions owned by user',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.PENDING
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

		const result = DomainOperationReportBuilder.build(
			OperationType.DELETE,
			submissionsCount,
			this.getSubmissionsId(submissionsEntities)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted single Submissions owned by user',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.FINISHED,
				submissionsCount,
				0
			)
		);

		return result;
	}

	async removeUserReferencesFromSubmissions(userId: EntityId): Promise<DomainOperationReport> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user references from Submissions',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.PENDING
			)
		);

		let [submissionsEntities, submissionsCount] = await this.submissionRepo.findAllByUserId(userId);

		if (submissionsCount > 0) {
			submissionsEntities = submissionsEntities.filter((submission) => submission.isGroupSubmission());
			submissionsCount = submissionsEntities.length;
		}

		if (submissionsCount > 0) {
			submissionsEntities.forEach((submission) => {
				submission.removeStudentById(userId);
				submission.removeUserFromTeamMembers(userId);
			});

			await this.submissionRepo.save(submissionsEntities);
		}

		const result = DomainOperationReportBuilder.build(
			OperationType.UPDATE,
			submissionsCount,
			this.getSubmissionsId(submissionsEntities)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted references from Submissions collection',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.FINISHED,
				submissionsCount,
				0
			)
		);
		return result;
	}

	private getSubmissionsId(submissions: Submission[]): EntityId[] {
		return submissions.map((submission) => submission.id);
	}
}

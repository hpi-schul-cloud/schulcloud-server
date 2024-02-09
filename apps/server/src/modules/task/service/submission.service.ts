import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { Submission } from '@shared/domain/entity';
import { DomainOperation } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { SubmissionRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';

@Injectable()
export class SubmissionService {
	constructor(
		private readonly submissionRepo: SubmissionRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: Logger
	) {}

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

	async deleteSubmissionsByUserId(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Submissions',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.PENDING
			)
		);
		const submissions = await this.submissionRepo.findAllByUserId(userId);
		const submissionsToDelete: Submission[] = [];

		if (submissions[1] > 0) {
			submissions[0].forEach((submission) => {
				if (submission.courseGroup === null && submission.teamMembers.length === 1) {
					submissionsToDelete.push(submission);
				}
			});
		}

		const submissionsToDeleteCount = submissionsToDelete.length;
		if (submissionsToDeleteCount > 0) {
			await this.submissionRepo.delete(submissionsToDelete);
		}

		const result = DomainOperationBuilder.build(
			DomainName.SUBMISSIONS,
			OperationType.DELETE,
			submissionsToDelete.length,
			this.getSubmissionsId(submissionsToDelete)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted data from Submissions',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.FINISHED,
				submissionsToDeleteCount,
				0
			)
		);

		return result;
	}

	async updateSubmissionByUserId(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Submissions',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.PENDING
			)
		);

		const submissions = await this.submissionRepo.findAllByUserId(userId);
		const submissionsToUpdate: Submission[] = [];

		if (submissions[1] > 0) {
			submissions[0].forEach((submission) => {
				if (submission.courseGroup !== null || (submission.courseGroup === null && submission.teamMembers.length > 1)) {
					submissionsToUpdate.push(submission);
				}
			});
		}

		const submissionsToUpdateCount = submissionsToUpdate.length;
		if (submissionsToUpdateCount > 0) {
			submissionsToUpdate.forEach((submission) => {
				submission.removeStudentById(userId);
				submission.removeUserFromTeamMembers(userId);
			});

			await this.submissionRepo.save(submissionsToUpdate);
		}
		const result = DomainOperationBuilder.build(
			DomainName.SUBMISSIONS,
			OperationType.UPDATE,
			submissionsToUpdateCount,
			this.getSubmissionsId(submissionsToUpdate)
		);

		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Submissions collection',
				DomainName.SUBMISSIONS,
				userId,
				StatusModel.FINISHED,
				submissionsToUpdateCount,
				0
			)
		);
		return result;
	}

	private getSubmissionsId(submissions: Submission[]): EntityId[] {
		return submissions.map((submission) => submission.id);
	}
}

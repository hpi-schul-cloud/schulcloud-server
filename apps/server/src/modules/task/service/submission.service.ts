import { Injectable } from '@nestjs/common';
import { Counted, EntityId, Submission } from '@shared/domain';
import { SubmissionRepo } from '@shared/repo';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

@Injectable()
export class SubmissionService {
	constructor(
		private readonly submissionRepo: SubmissionRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async findById(submissionId: EntityId): Promise<Submission> {
		return this.submissionRepo.findById(submissionId);
	}

	async findAllByTask(taskId: EntityId): Promise<Counted<Submission[]>> {
		const submissions = this.submissionRepo.findAllByTaskIds([taskId]);

		return submissions;
	}

	async deleteSubmission(submission: Submission): Promise<void> {
		const params = FileParamBuilder.build(submission.school.id, submission);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(params);

		await this.submissionRepo.delete(submission);
	}
}

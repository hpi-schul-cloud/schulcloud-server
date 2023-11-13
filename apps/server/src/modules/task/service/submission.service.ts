import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { Submission } from '@shared/domain/entity';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { SubmissionRepo } from '../repo';

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

	async delete(submission: Submission): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(submission.id);

		await this.submissionRepo.delete(submission);
	}
}

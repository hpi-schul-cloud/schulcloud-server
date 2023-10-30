import { Injectable } from '@nestjs/common';
import { Submission } from '@shared/domain/entity/submission.entity';
import { Counted } from '@shared/domain/types/counted';
import { EntityId } from '@shared/domain/types/entity-id';
import { SubmissionRepo } from '@shared/repo/submission/submission.repo';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client/service/files-storage-client.service';

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

import { Logger } from '@core/logger';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { Submission, SubmissionRepo } from '../../repo';

@Injectable()
export class SubmissionService {
	constructor(
		private readonly submissionRepo: SubmissionRepo,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: Logger
	) {
		this.logger.setContext(SubmissionService.name);
	}

	public async findById(submissionId: EntityId): Promise<Submission> {
		const submission = await this.submissionRepo.findById(submissionId);

		return submission;
	}

	public async findAllByTask(taskId: EntityId): Promise<Counted<Submission[]>> {
		const submissions = await this.submissionRepo.findAllByTaskIds([taskId]);

		return submissions;
	}

	public async delete(submission: Submission): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(submission.id);

		await this.submissionRepo.delete(submission);
	}
}

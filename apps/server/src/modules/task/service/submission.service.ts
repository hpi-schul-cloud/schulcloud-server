import { Injectable } from '@nestjs/common';
import { Counted, EntityId, Submission } from '@shared/domain';
import { SubmissionRepo } from '@shared/repo';

@Injectable()
export class SubmissionService {
	constructor(private readonly submissionRepo: SubmissionRepo) {}

	async findAllByTask(taskId: EntityId): Promise<Counted<Submission[]>> {
		const submissions = this.submissionRepo.findAllByTaskIds([taskId]);

		return submissions;
	}
}

import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted } from '../../../shared/domain';
import { Submission, Task } from '../entity';

// TODO: move into different file
export type SubmissionsMetaData = { submitted: number; maxSubmissions: number; graded: number };

@Injectable()
export class SubmissionRepo {
	constructor(private readonly em: EntityManager) {}

	async getSubmissionsByTask(task: Task): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this.em.findAndCount(Submission, {
			homework: task,
		});
		return [submissions, count];
	}
}

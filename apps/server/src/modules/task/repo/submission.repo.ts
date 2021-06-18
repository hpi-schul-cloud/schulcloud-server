import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted } from '../../../shared/domain';
import { Submission, Task } from '../entity';

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

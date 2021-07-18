import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted } from '../../../shared/domain';
import { Submission, Task } from '../entity';

// TODO: add schoolId as filter vs shd operations?
@Injectable()
export class SubmissionRepo {
	constructor(private readonly em: EntityManager) {}

	async getSubmissionsByTasksList(tasks: Task[]): Promise<Counted<Submission[]>> {
		const [submissions, count] = await this.em.findAndCount(Submission, {
			task: { $in: tasks },
		});

		return [submissions, count];
	}
}

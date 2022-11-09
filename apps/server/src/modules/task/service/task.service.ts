import { Injectable } from '@nestjs/common';
import { TaskRepo } from '@shared/repo';
import { Counted, EntityId, IFindOptions, Task } from '@shared/domain';

@Injectable()
export class TaskService {
	constructor(private readonly taskRepo: TaskRepo) {}

	async findBySingleParent(
		creatorId: EntityId,
		courseId: EntityId,
		filters?: { draft?: boolean; noFutureAvailableDate?: boolean },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		return this.taskRepo.findBySingleParent(creatorId, courseId, filters, options);
	}
}

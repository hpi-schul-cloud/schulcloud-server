import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../shared/core/types/paginated';
import { ITaskOption, EntityId, ITaskMetadata } from '../entity';
import { TaskRepo } from '../repo/task.repo';

// filter tasks older than 3 weeks
@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo) {}

	async findAllOpenForUser(userId: EntityId, option: ITaskOption): Promise<Paginated<ITaskMetadata[]>> {
		return this.taskRepo.findAllOpenByStudent(userId, option);
	}
}

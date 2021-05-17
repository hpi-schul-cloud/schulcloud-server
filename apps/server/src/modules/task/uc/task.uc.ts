import { Injectable } from '@nestjs/common';
import { EntityId } from '../../../shared/domain';
import { ITaskOption, ITaskMetadata } from '../entity';
import { TaskRepo } from '../repo/task.repo';

// filter tasks older than 3 weeks
// TODO: move dtos folder one level higher
@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo) {}

	async findAllOpenForUser(userId: EntityId, option: ITaskOption): Promise<ITaskMetadata[]> {
		return this.taskRepo.findAllOpenByStudent(userId, option);
	}
}

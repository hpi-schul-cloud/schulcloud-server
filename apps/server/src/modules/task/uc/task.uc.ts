import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { ITaskOption, Task, EntityId } from '../entity';
import { TaskRepo } from '../repo/task.repo';

// filter tasks older than 3 weeks
// TODO: move dtos folder one level higher
@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo) {}

	async findAllOpenForUser(userId: EntityId, option: ITaskOption): Promise<Task[]>  {
		return this.taskRepo.findAllOpenByStudent(userId, option);
	}
}

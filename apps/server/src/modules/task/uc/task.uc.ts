import { Injectable } from '@nestjs/common';
import { EntityId } from '../../../shared/domain/entity-id';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { Task } from '../entity/task.entity';
import { TaskRepo } from '../repo/task.repo';

// filter tasks older than 3 weeks

@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo) {}

	async findAllOpenForUser(userId: EntityId): Promise<Task[]>  {
		return this.taskRepo.findAllOpenByStudent(userId);
	}
}

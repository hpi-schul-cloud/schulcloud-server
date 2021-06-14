import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../../shared/core/controller/dto/pagination.query.dto';
import { Paginated } from '../../../shared/core/types/paginated';
import { EntityId, ITaskMetadata } from '../entity';
import { TaskRepo } from '../repo/task.repo';

// filter tasks older than 3 weeks
@Injectable()
export class TaskUC {
	constructor(private taskRepo: TaskRepo) {}

	async findAllOpenForUser(userId: EntityId, pagination: PaginationQueryDto): Promise<Paginated<ITaskMetadata[]>> {
		return this.taskRepo.findAllOpenByStudent(userId, pagination);
	}
}

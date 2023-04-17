import { Injectable } from '@nestjs/common';
import { EntityId, TaskCard } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class TaskCardRepo extends BaseRepo<TaskCard> {
	get entityName() {
		return TaskCard;
	}

	private async populate(taskCards: TaskCard[]): Promise<void> {
		await this._em.populate(taskCards, ['cardElements', 'task', 'task.course', 'completedUsers']);
	}

	async findById(id: EntityId): Promise<TaskCard> {
		const card = await this._em.findOneOrFail(this.entityName, { id });

		await this.populate([card]);

		return card;
	}
}

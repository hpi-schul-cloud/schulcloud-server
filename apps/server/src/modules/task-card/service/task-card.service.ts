import { Injectable } from '@nestjs/common';
import { EntityId, Permission, PermissionContextBuilder } from '@shared/domain';
import { TaskCardRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';

@Injectable()
export class TaskCardService {
	constructor(
		private readonly taskCardRepo: TaskCardRepo,
		private readonly authorizationService: AuthorizationService
	) {}

	async countCompletedForUsers(userId: EntityId, taskCardId: EntityId): Promise<number> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const taskCard = await this.taskCardRepo.findById(taskCardId);

		this.authorizationService.checkPermission(
			user,
			taskCard,
			PermissionContextBuilder.write([Permission.TASK_CARD_EDIT])
		);

		const completedForUsers = taskCard.getCompletedUserIds();

		return completedForUsers.length;
	}

	async isCompletedForUser(userId: EntityId, taskCardId: EntityId): Promise<boolean> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const taskCard = await this.taskCardRepo.findById(taskCardId);

		this.authorizationService.checkPermission(
			user,
			taskCard,
			PermissionContextBuilder.read([Permission.TASK_CARD_VIEW])
		);

		const completedForUsers = taskCard.getCompletedUserIds();
		completedForUsers.filter((completedUserId) => completedUserId.id === userId);

		return completedForUsers.length > 0;
	}
}

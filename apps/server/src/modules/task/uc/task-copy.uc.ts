import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Actions, CopyStatus, EntityId, User } from '@shared/domain';
import { TaskCopyService } from '../../../shared/domain/service/task-copy.service';
import { CourseRepo, TaskRepo } from '../../../shared/repo';
import { AuthorizationService } from '../../authorization';

export type TaskCopyParentParams = {
	courseId?: EntityId;
	lessonId?: EntityId;
};

@Injectable()
export class TaskCopyUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly courseRepo: CourseRepo,
		private readonly authorisation: AuthorizationService,
		private readonly taskCopyService: TaskCopyService
	) {}

	async copyTask(userId: EntityId, taskId: EntityId, parentParams: TaskCopyParentParams): Promise<CopyStatus> {
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalTask = await this.taskRepo.findById(taskId);
		if (
			!this.authorisation.hasPermission(user, originalTask, {
				action: Actions.read,
				requiredPermissions: [],
			})
		) {
			throw new NotFoundException('could not find task to copy');
		}
		const destinationCourse = await this.getDestinationCourse(parentParams.courseId, user);
		const { copy, status } = this.taskCopyService.copyTaskMetadata({
			originalTask,
			destinationCourse,
			user,
		});
		await this.taskRepo.save(copy);
		return status;
	}

	private async getDestinationCourse(courseId: string | undefined, user: User) {
		if (courseId) {
			const destinationCourse = await this.courseRepo.findById(courseId);
			if (
				!this.authorisation.hasPermission(user, destinationCourse, {
					action: Actions.write,
					requiredPermissions: [],
				})
			) {
				throw new ForbiddenException('you dont have permission to add to this course');
			}
			return destinationCourse;
		}
		return undefined;
	}
}

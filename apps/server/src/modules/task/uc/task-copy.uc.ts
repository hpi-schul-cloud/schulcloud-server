import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Actions, CopyStatusDTO, EntityId } from '@shared/domain';
import { TaskCopyService } from '../../../shared/domain/service/task-copy.service';
import { CourseRepo, TaskRepo, UserRepo } from '../../../shared/repo';
import { AuthorizationService } from '../../authorization';

export type TaskCopyParentParams = {
	courseId: EntityId;
	lessonId?: EntityId;
};

@Injectable()
export class TaskCopyUc {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly taskRepo: TaskRepo,
		private readonly courseRepo: CourseRepo,
		private readonly authorisation: AuthorizationService,
		private readonly taskCopyService: TaskCopyService
	) {}

	async copyTask(userId: EntityId, taskId: EntityId, parentParams: TaskCopyParentParams): Promise<CopyStatusDTO> {
		const user = await this.userRepo.findById(userId, true);
		const originalTask = await this.taskRepo.findById(taskId);
		if (!this.authorisation.hasPermission(user, originalTask, Actions.read)) {
			throw new NotFoundException('could not find task to copy');
		}
		const destinationCourse = await this.courseRepo.findById(parentParams.courseId);
		if (!this.authorisation.hasPermission(user, destinationCourse, Actions.write)) {
			throw new ForbiddenException('you dont have permission to add to this course');
		}
		const { copy, status } = this.taskCopyService.copyTaskMetadata({
			originalTask,
			destinationCourse,
			user,
		});
		await this.taskRepo.save(copy);
		return status;
	}
}

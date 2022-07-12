import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CopyStatus, EntityId, PermissionContextBuilder, User, TaskCopyService, Task } from '@shared/domain';
import { CourseRepo, TaskRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';

// todo: it look like it is required not optional
export type TaskCopyParentParams = {
	courseId?: EntityId;
	lessonId?: EntityId;
	jwt?: string;
};

@Injectable()
export class TaskCopyUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly courseRepo: CourseRepo,
		private readonly authorisation: AuthorizationService,
		private readonly taskCopyService: TaskCopyService,
		private readonly filesStorageClient: FilesStorageClientAdapterService
	) {}

	async copyTask(userId: EntityId, taskId: EntityId, parentParams: TaskCopyParentParams): Promise<CopyStatus> {
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalTask = await this.taskRepo.findById(taskId);
		if (!this.authorisation.hasPermission(user, originalTask, PermissionContextBuilder.read([]))) {
			throw new NotFoundException('could not find task to copy');
		}
		const destinationCourse = await this.getDestinationCourse(parentParams.courseId, user);
		const status = this.taskCopyService.copyTaskMetadata({
			originalTask,
			destinationCourse,
			user,
		});

		if (status.copyEntity) {
			const taskCopy = status.copyEntity as Task;
			await this.taskRepo.save(taskCopy);
		}
		return status;
	}

	private async getDestinationCourse(courseId: string | undefined, user: User) {
		if (courseId) {
			const destinationCourse = await this.courseRepo.findById(courseId);
			if (!this.authorisation.hasPermission(user, destinationCourse, PermissionContextBuilder.write([]))) {
				throw new ForbiddenException('you dont have permission to add to this course');
			}
			return destinationCourse;
		}
		return undefined;
	}
}

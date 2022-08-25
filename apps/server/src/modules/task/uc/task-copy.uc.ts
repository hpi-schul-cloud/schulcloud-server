import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
	CopyHelperService,
	CopyStatus,
	Course,
	EntityId,
	Lesson,
	PermissionContextBuilder,
	Task,
	TaskCopyService,
	User,
} from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';

// todo: it look like it is required not optional
export type TaskCopyParentParams = {
	courseId?: EntityId;
	lessonId?: EntityId;
	jwt: string;
};

@Injectable()
export class TaskCopyUC {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly authorisation: AuthorizationService,
		private readonly taskCopyService: TaskCopyService,
		private readonly copyHelperService: CopyHelperService,
		private readonly fileCopyAppendService: FileCopyAppendService
	) {}

	async copyTask(userId: EntityId, taskId: EntityId, parentParams: TaskCopyParentParams): Promise<CopyStatus> {
		this.featureEnabled();
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalTask = await this.taskRepo.findById(taskId);
		if (!this.authorisation.hasPermission(user, originalTask, PermissionContextBuilder.read([]))) {
			throw new NotFoundException('could not find task to copy');
		}

		let existingNames: string[] = [];
		let destinationCourse: Course | undefined;

		if (parentParams.courseId) {
			destinationCourse = await this.getDestinationCourse(parentParams.courseId, user);
			const [existingTasks] = await this.taskRepo.findBySingleParent('', parentParams.courseId);
			existingNames = existingTasks.map((t) => t.name);
		}

		const copyName = this.copyHelperService.deriveCopyName(originalTask.name, existingNames);

		let destinationLesson: Lesson | undefined;

		if (parentParams.lessonId) {
			destinationLesson = await this.getDestinationLesson(parentParams.lessonId, user);
		}

		let status = this.taskCopyService.copyTaskMetadata({
			originalTask,
			destinationCourse,
			destinationLesson,
			user,
			copyName,
		});

		if (status.copyEntity) {
			const taskCopy = status.copyEntity as Task;
			await this.taskRepo.save(taskCopy);
			status = await this.fileCopyAppendService.appendFiles(status, parentParams.jwt);
		}

		return status;
	}

	private async getDestinationCourse(courseId: string, user: User) {
		const destinationCourse = await this.courseRepo.findById(courseId);
		if (!this.authorisation.hasPermission(user, destinationCourse, PermissionContextBuilder.write([]))) {
			throw new ForbiddenException('you dont have permission to add to this course');
		}
		return destinationCourse;
	}

	private async getDestinationLesson(lessonId: string, user: User) {
		const destinationLesson = await this.lessonRepo.findById(lessonId);
		if (!this.authorisation.hasPermission(user, destinationLesson, PermissionContextBuilder.write([]))) {
			throw new ForbiddenException('you dont have permission to add to this lesson');
		}
		return destinationLesson;
	}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}

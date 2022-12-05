import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
	CopyHelperService,
	CopyStatus,
	Course,
	EntityId,
	Lesson,
	PermissionContextBuilder,
	User,
} from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { TaskCopyService } from '../service';

// todo: it look like it is required not optional
export type TaskCopyParentParams = {
	courseId?: EntityId;
	lessonId?: EntityId;
	userId: string;
};

@Injectable()
export class TaskCopyUC {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly authorisation: AuthorizationService,
		private readonly taskCopyService: TaskCopyService,
		private readonly taskRepo: TaskRepo,
		private readonly copyHelperService: CopyHelperService
	) {}

	async copyTask(userId: EntityId, taskId: EntityId, parentParams: TaskCopyParentParams): Promise<CopyStatus> {
		this.featureEnabled();
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalTask = await this.taskRepo.findById(taskId);
		if (!this.authorisation.hasPermission(user, originalTask, PermissionContextBuilder.read([]))) {
			throw new NotFoundException('could not find task to copy');
		}

		const destinationCourse = await this.getDestinationCourse(parentParams.courseId, user);
		const destinationLesson = await this.getDestinationLesson(parentParams.lessonId, user);
		const copyName = await this.getCopyName(originalTask.name, parentParams.courseId);

		const status = await this.taskCopyService.copyTask({
			originalTask,
			destinationCourse,
			destinationLesson,
			user,
			copyName,
		});

		return status;
	}

	private async getCopyName(originalTaskName: string, parentCourseId: EntityId | undefined) {
		let existingNames: string[] = [];
		if (parentCourseId) {
			const [existingTasks] = await this.taskRepo.findBySingleParent('', parentCourseId);
			existingNames = existingTasks.map((t) => t.name);
		}
		return this.copyHelperService.deriveCopyName(originalTaskName, existingNames);
	}

	private async getDestinationCourse(courseId: string | undefined, user: User): Promise<Course | undefined> {
		if (courseId === undefined) {
			return undefined;
		}

		const destinationCourse = await this.courseRepo.findById(courseId);
		if (!this.authorisation.hasPermission(user, destinationCourse, PermissionContextBuilder.write([]))) {
			throw new ForbiddenException('you dont have permission to add to this course');
		}
		return destinationCourse;
	}

	private async getDestinationLesson(lessonId: string | undefined, user: User): Promise<Lesson | undefined> {
		if (lessonId === undefined) {
			return undefined;
		}

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

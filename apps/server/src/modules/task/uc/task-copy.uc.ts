import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Course, EntityId, Lesson, User } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import {
	Action,
	AllowedAuthorizationEntityType,
	AuthorizationContextBuilder,
	AuthorizationService,
} from '@src/modules/authorization';
import { CopyHelperService, CopyStatus } from '@src/modules/copy-helper';
import { TaskCopyService } from '../service';
import { TaskCopyParentParams } from '../types';

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
		if (!this.authorisation.isAuthorized(user, originalTask, AuthorizationContextBuilder.read([]))) {
			throw new NotFoundException('could not find task to copy');
		}

		const destinationCourse = await this.getDestinationCourse(parentParams.courseId);
		if (parentParams.courseId) {
			await this.authorisation.checkIfAuthorizedByReferences(
				userId,
				AllowedAuthorizationEntityType.Course,
				parentParams.courseId,
				{
					action: Action.write,
					requiredPermissions: [],
				}
			);
		}

		const destinationLesson = await this.getDestinationLesson(parentParams.lessonId, user);
		const copyName = await this.getCopyName(originalTask.name, parentParams.courseId);

		const status = await this.taskCopyService.copyTask({
			originalTaskId: originalTask.id,
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

	private async getDestinationCourse(courseId: string | undefined): Promise<Course | undefined> {
		if (courseId === undefined) {
			return undefined;
		}

		const destinationCourse = await this.courseRepo.findById(courseId);

		return destinationCourse;
	}

	private async getDestinationLesson(lessonId: string | undefined, user: User): Promise<Lesson | undefined> {
		if (lessonId === undefined) {
			return undefined;
		}

		const destinationLesson = await this.lessonRepo.findById(lessonId);
		if (!this.authorisation.isAuthorized(user, destinationLesson, AuthorizationContextBuilder.write([]))) {
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

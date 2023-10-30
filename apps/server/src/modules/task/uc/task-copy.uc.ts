import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Course } from '@shared/domain/entity/course.entity';
import { LessonEntity } from '@shared/domain/entity/lesson.entity';
import { User } from '@shared/domain/entity/user.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { CopyHelperService } from '@src/modules/copy-helper/service/copy-helper.service';
import { CopyStatus } from '@src/modules/copy-helper/types/copy.types';
import { TaskCopyService } from '../service/task-copy.service';
import { TaskCopyParentParams } from '../types/task-copy-parent.params';

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
		if (!this.authorisation.hasPermission(user, originalTask, AuthorizationContextBuilder.read([]))) {
			throw new NotFoundException('could not find task to copy');
		}

		const destinationCourse = await this.getDestinationCourse(parentParams.courseId);
		if (parentParams.courseId) {
			await this.authorisation.checkPermissionByReferences(
				userId,
				AuthorizableReferenceType.Course,
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

	private async getDestinationLesson(lessonId: string | undefined, user: User): Promise<LessonEntity | undefined> {
		if (lessonId === undefined) {
			return undefined;
		}

		const destinationLesson = await this.lessonRepo.findById(lessonId);
		if (!this.authorisation.hasPermission(user, destinationLesson, AuthorizationContextBuilder.write([]))) {
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

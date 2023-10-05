import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Course, EntityId, Task, LessonEntity, User } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
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
		this.checkFeatureEnabled();

		// i put it to promise all, it do not look like any more information can be expose over errors if it is called between the authorizations
		// TODO: Add try catch around it with throw BadRequest invalid data
		const [authorizableUser, originalTask, destinationCourse]: [User, Task, Course | undefined] = await Promise.all([
			this.authorisation.getUserWithPermissions(userId),
			this.taskRepo.findById(taskId),
			this.getDestinationCourse(parentParams.courseId),
		]);

		this.checkOriginalTaskAuthorization(authorizableUser, originalTask);

		if (destinationCourse) {
			this.checkDestinationCourseAuthorisation(authorizableUser, destinationCourse);
		}

		// i think getDestinationLesson can also to a promise.all on top
		// then getCopyName can be put into if (destinationCourse) {
		// but then the test need to cleanup
		const [destinationLesson, copyName]: [LessonEntity | undefined, string | undefined] = await Promise.all([
			this.getDestinationLesson(parentParams.lessonId),
			this.getCopyName(originalTask.name, parentParams.courseId),
		]);

		if (destinationLesson) {
			this.checkDestinationLessonAuthorization(authorizableUser, destinationLesson);
		}

		const status = await this.taskCopyService.copyTask({
			originalTaskId: originalTask.id,
			destinationCourse,
			destinationLesson,
			user: authorizableUser,
			copyName,
		});

		return status;
	}

	private checkOriginalTaskAuthorization(authorizableUser: User, originalTask: Task): void {
		const context = AuthorizationContextBuilder.read([]);
		if (!this.authorisation.hasPermission(authorizableUser, originalTask, context)) {
			// error message and erorr type are not correct
			throw new NotFoundException('could not find task to copy');
		}
	}

	private checkDestinationCourseAuthorisation(authorizableUser: User, destinationCourse: Course): void {
		const context = AuthorizationContextBuilder.write([]);
		this.authorisation.checkPermission(authorizableUser, destinationCourse, context);
	}

	private checkDestinationLessonAuthorization(authorizableUser: User, destinationLesson: LessonEntity): void {
		const context = AuthorizationContextBuilder.write([]);
		if (!this.authorisation.hasPermission(authorizableUser, destinationLesson, context)) {
			throw new ForbiddenException('you dont have permission to add to this lesson');
		}
	}

	private async getCopyName(originalTaskName: string, parentCourseId: EntityId | undefined) {
		let existingNames: string[] = [];
		if (parentCourseId) {
			// It should really get an task where the creatorId === '' ?
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

	private async getDestinationLesson(lessonId: string | undefined): Promise<LessonEntity | undefined> {
		if (lessonId === undefined) {
			return undefined;
		}

		const destinationLesson = await this.lessonRepo.findById(lessonId);

		return destinationLesson;
	}

	private checkFeatureEnabled() {
		// This is the deprecated way to read envirement variables
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}

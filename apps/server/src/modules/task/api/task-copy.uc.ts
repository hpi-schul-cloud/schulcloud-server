import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CopyHelperService, CopyStatus } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { LessonService } from '@modules/lesson';
import { LessonEntity } from '@modules/lesson/repo';
import { User } from '@modules/user/repo';
import {
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { TaskCopyService } from '../domain';
import { Task, TaskRepo } from '../repo';
import { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from '../task.config';
import { TaskCopyParentParams } from './dto';

@Injectable()
export class TaskCopyUC {
	constructor(
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly authorisation: AuthorizationService,
		private readonly taskCopyService: TaskCopyService,
		private readonly taskRepo: TaskRepo,
		private readonly copyHelperService: CopyHelperService,
		@Inject(TASK_PUBLIC_API_CONFIG_TOKEN)
		private readonly config: TaskPublicApiConfig
	) {}

	public async copyTask(userId: EntityId, taskId: EntityId, parentParams: TaskCopyParentParams): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		// i put it to promise all, it do not look like any more information can be expose over errors if it is called between the authorizations
		// TODO: Add try catch around it with throw BadRequest invalid data
		const [authorizableUser, originalTask, destinationCourse]: [User, Task, CourseEntity | undefined] =
			await Promise.all([
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

	private checkDestinationCourseAuthorisation(authorizableUser: User, destinationCourse: CourseEntity): void {
		const context = AuthorizationContextBuilder.write([]);
		this.authorisation.checkPermission(authorizableUser, destinationCourse, context);
	}

	private checkDestinationLessonAuthorization(authorizableUser: User, destinationLesson: LessonEntity): void {
		const context = AuthorizationContextBuilder.write([]);
		if (!this.authorisation.hasPermission(authorizableUser, destinationLesson, context)) {
			throw new ForbiddenException('you dont have permission to add to this lesson');
		}
	}

	private async getCopyName(originalTaskName: string, parentCourseId: EntityId | undefined): Promise<string> {
		let existingNames: string[] = [];
		if (parentCourseId) {
			// It should really get an task where the creatorId === '' ?
			const [existingTasks] = await this.taskRepo.findBySingleParent('', parentCourseId);
			existingNames = existingTasks.map((t) => t.name);
		}

		return this.copyHelperService.deriveCopyName(originalTaskName, existingNames);
	}

	private async getDestinationCourse(courseId: string | undefined): Promise<CourseEntity | undefined> {
		if (courseId === undefined) {
			return undefined;
		}

		const destinationCourse = await this.courseService.findById(courseId);

		return destinationCourse;
	}

	private async getDestinationLesson(lessonId: string | undefined): Promise<LessonEntity | undefined> {
		if (lessonId === undefined) {
			return undefined;
		}

		const destinationLesson = await this.lessonService.findById(lessonId);

		return destinationLesson;
	}

	private checkFeatureEnabled(): void {
		const enabled = this.config.featureCopyServiceEnabled;

		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}

import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import {
	Counted,
	EntityId,
	IFindOptions,
	ITaskCreate,
	ITaskProperties,
	ITaskUpdate,
	Permission,
	PermissionContextBuilder,
	Task,
	TaskWithStatusVo,
} from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { SubmissionService } from './submission.service';

@Injectable()
export class TaskService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly authorizationService: AuthorizationService,
		private readonly courseRepo: CourseRepo,
		private readonly lessonRepo: LessonRepo,
		private readonly submissionService: SubmissionService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService
	) {}

	async findBySingleParent(
		creatorId: EntityId,
		courseId: EntityId,
		filters?: { draft?: boolean; noFutureAvailableDate?: boolean },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		return this.taskRepo.findBySingleParent(creatorId, courseId, filters, options);
	}

	async delete(task: Task): Promise<void> {
		const params = FileParamBuilder.build(task.school.id, task);
		await this.filesStorageClientAdapterService.deleteFilesOfParent(params);

		await this.deleteSubmissions(task);

		await this.taskRepo.delete(task);
	}

	private async deleteSubmissions(task: Task): Promise<void> {
		const submissions = task.submissions.getItems();
		const promises = submissions.map((submission) => this.submissionService.delete(submission));

		await Promise.all(promises);
	}

	async create(userId: EntityId, params: ITaskCreate): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const taskParams: ITaskProperties = {
			...params,
			school: user.school,
			creator: user,
		};
		this.taskDateValidation(taskParams.availableDate, taskParams.dueDate);

		if (!this.authorizationService.hasAllPermissions(user, [Permission.HOMEWORK_CREATE])) {
			throw new UnauthorizedException();
		}

		if (params.courseId) {
			const course = await this.courseRepo.findById(params.courseId);
			this.authorizationService.checkPermission(user, course, PermissionContextBuilder.write([]));
			taskParams.course = course;
		}

		if (params.lessonId) {
			const lesson = await this.lessonRepo.findById(params.lessonId);
			if (!taskParams.course || lesson.course.id !== taskParams.course.id) {
				throw new BadRequestException('Lesson does not belong to Course');
			}
			this.authorizationService.checkPermission(user, lesson, PermissionContextBuilder.write([]));
			taskParams.lesson = lesson;
		}

		const task = new Task(taskParams);

		await this.taskRepo.save(task);

		const status = task.createTeacherStatusForUser(user);
		const taskWithStatusVo = new TaskWithStatusVo(task, status);

		return taskWithStatusVo;
	}

	async find(userId: EntityId, taskId: EntityId) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, PermissionContextBuilder.read([Permission.HOMEWORK_VIEW]));

		const status = this.authorizationService.hasOneOfPermissions(user, [Permission.HOMEWORK_EDIT])
			? task.createTeacherStatusForUser(user)
			: task.createStudentStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	async update(userId: EntityId, taskId: EntityId, params: ITaskUpdate): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkPermission(user, task, PermissionContextBuilder.write([Permission.HOMEWORK_EDIT]));

		// eslint-disable-next-line no-restricted-syntax
		for (const [key, value] of Object.entries(params)) {
			if (value) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				task[key] = value;
			}
		}

		if (params.courseId) {
			const course = await this.courseRepo.findById(params.courseId);
			this.authorizationService.checkPermission(user, course, PermissionContextBuilder.write([]));
			task.course = course;
		}

		if (params.lessonId) {
			const lesson = await this.lessonRepo.findById(params.lessonId);
			if (!task.course || lesson.course.id !== task.course.id) {
				throw new BadRequestException('Lesson does not belong to Course');
			}
			this.authorizationService.checkPermission(user, lesson, PermissionContextBuilder.write([]));
			task.lesson = lesson;
		}

		this.taskDateValidation(params.availableDate, params.dueDate);

		await this.taskRepo.save(task);

		const status = task.createTeacherStatusForUser(user);
		const taskWithStatusVo = new TaskWithStatusVo(task, status);

		return taskWithStatusVo;
	}

	private taskDateValidation(availableDate?: Date, dueDate?: Date) {
		if (availableDate && dueDate && !(availableDate < dueDate)) {
			throw new ValidationError('availableDate must be before dueDate');
		}
	}
}

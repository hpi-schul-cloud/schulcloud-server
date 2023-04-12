import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidationError } from '@shared/common';
import {
	Counted,
	EntityId,
	IFindOptions,
	ITaskCreate,
	ITaskProperties,
	ITaskUpdate,
	Permission,
	Task,
	TaskWithStatusVo,
} from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { SubmissionService } from './submission.service';

@Injectable()
export class TaskService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly userRepo: UserRepo,
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
			this.authorizationService.checkIfAuthorized(user, course, AuthorizationContextBuilder.write([]));
			taskParams.course = course;

			if (params.usersIds) {
				const courseUsers = course.getStudentIds();
				const isAllUsersInCourse = params.usersIds.every((id) => courseUsers.includes(id));
				if (!isAllUsersInCourse) {
					throw new ForbiddenException('Users do not belong to course');
				}
				const users = await Promise.all(params.usersIds.map(async (id) => this.userRepo.findById(id)));
				taskParams.users = users;
			}
		}

		if (params.lessonId) {
			const lesson = await this.lessonRepo.findById(params.lessonId);
			if (!taskParams.course || lesson.course.id !== taskParams.course.id) {
				throw new ForbiddenException('Lesson does not belong to Course');
			}
			this.authorizationService.checkIfAuthorized(user, lesson, AuthorizationContextBuilder.write([]));
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

		this.authorizationService.checkIfAuthorized(
			user,
			task,
			AuthorizationContextBuilder.read([Permission.HOMEWORK_VIEW])
		);

		const status = this.authorizationService.hasOneOfPermissions(user, [Permission.HOMEWORK_EDIT])
			? task.createTeacherStatusForUser(user)
			: task.createStudentStatusForUser(user);

		const result = new TaskWithStatusVo(task, status);

		return result;
	}

	async findById(taskId: EntityId): Promise<Task> {
		return this.taskRepo.findById(taskId);
	}

	async update(userId: EntityId, taskId: EntityId, params: ITaskUpdate, remove = false): Promise<TaskWithStatusVo> {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const task = await this.taskRepo.findById(taskId);

		this.authorizationService.checkIfAuthorized(
			user,
			task,
			AuthorizationContextBuilder.write([Permission.HOMEWORK_EDIT])
		);

		// eslint-disable-next-line no-restricted-syntax
		for (const [key, value] of Object.entries(params)) {
			if (value) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				task[key] = value;
			}
		}

		if (params.courseId) {
			const course = await this.courseRepo.findById(params.courseId);
			this.authorizationService.checkIfAuthorized(user, course, AuthorizationContextBuilder.write([]));
			task.course = course;

			if (params.usersIds) {
				const courseUsers = course.getStudentIds();
				const isAllUsersInCourse = params.usersIds.every((id) => courseUsers.includes(id));
				if (!isAllUsersInCourse) {
					throw new ForbiddenException('Users do not belong to course');
				}
				const users = await Promise.all(params.usersIds.map(async (id) => this.userRepo.findById(id)));
				task.users.set(users);
			} else if (remove) {
				task.users.removeAll();
			}
		} else if (remove) {
			task.course = undefined;
			task.lesson = undefined;
			task.users.removeAll();
		}

		if (params.lessonId) {
			const lesson = await this.lessonRepo.findById(params.lessonId);
			if (!task.course || lesson.course.id !== task.course.id) {
				throw new ForbiddenException('Lesson does not belong to Course');
			}
			this.authorizationService.checkIfAuthorized(user, lesson, AuthorizationContextBuilder.write([]));
			task.lesson = lesson;
		} else if (remove) {
			task.lesson = undefined;
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

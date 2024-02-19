import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { Task } from '@shared/domain/entity';
import { DeletionService, DomainOperation, IFindOptions } from '@shared/domain/interface';
import { Counted, DomainName, EntityId, OperationType, StatusModel } from '@shared/domain/types';
import { TaskRepo } from '@shared/repo';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { Logger } from '@src/core/logger';
import { DataDeletionDomainOperationLoggable } from '@shared/common/loggable';
import { SubmissionService } from './submission.service';

@Injectable()
export class TaskService implements DeletionService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionService: SubmissionService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: Logger
	) {
		this.logger.setContext(TaskService.name);
	}

	async findBySingleParent(
		creatorId: EntityId,
		courseId: EntityId,
		filters?: { draft?: boolean; noFutureAvailableDate?: boolean },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		return this.taskRepo.findBySingleParent(creatorId, courseId, filters, options);
	}

	async delete(task: Task): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(task.id);

		await this.deleteSubmissions(task);

		await this.taskRepo.delete(task);
	}

	private async deleteSubmissions(task: Task): Promise<void> {
		const submissions = task.submissions.getItems();
		const promises = submissions.map((submission) => this.submissionService.delete(submission));

		await Promise.all(promises);
	}

	async findById(taskId: EntityId): Promise<Task> {
		return this.taskRepo.findById(taskId);
	}

	async deleteUserData(creatorId: EntityId): Promise<DomainOperation[]> {
		const [tasksDeleted, tasksModifiedByRemoveCreator, tasksModifiedByRemoveUserFromFinished] = await Promise.all([
			this.deleteTasksByOnlyCreator(creatorId),
			this.removeCreatorIdFromTasks(creatorId),
			this.removeUserFromFinished(creatorId),
		]);

		const modifiedTasksCount = tasksModifiedByRemoveCreator.count + tasksModifiedByRemoveUserFromFinished.count;
		const modifiedTasksRef = [...tasksModifiedByRemoveCreator.refs, ...tasksModifiedByRemoveUserFromFinished.refs];

		return [
			tasksDeleted,
			DomainOperationBuilder.build(
				tasksModifiedByRemoveCreator.domain,
				tasksModifiedByRemoveCreator.operation,
				modifiedTasksCount,
				modifiedTasksRef
			),
		];
	}

	async deleteTasksByOnlyCreator(creatorId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting data from Task',
				DomainName.TASK,
				creatorId,
				StatusModel.PENDING
			)
		);

		const [tasksByOnlyCreatorId, counterOfTasksOnlyWithCreatorId] = await this.taskRepo.findByOnlyCreatorId(creatorId);

		if (counterOfTasksOnlyWithCreatorId > 0) {
			const promiseDeletedTasks = tasksByOnlyCreatorId.map((task: Task) => this.delete(task));
			await Promise.all(promiseDeletedTasks);
		}

		const result = DomainOperationBuilder.build(
			DomainName.TASK,
			OperationType.DELETE,
			counterOfTasksOnlyWithCreatorId,
			this.getTasksId(tasksByOnlyCreatorId)
		);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted data from Task',
				DomainName.TASK,
				creatorId,
				StatusModel.FINISHED,
				counterOfTasksOnlyWithCreatorId,
				0
			)
		);

		return result;
	}

	async removeCreatorIdFromTasks(creatorId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Task',
				DomainName.TASK,
				creatorId,
				StatusModel.PENDING
			)
		);
		const [tasksByCreatorIdWithCoursesAndLessons, counterOfTasksWithCoursesorLessons] =
			await this.taskRepo.findByCreatorIdWithCourseAndLesson(creatorId);

		if (counterOfTasksWithCoursesorLessons > 0) {
			tasksByCreatorIdWithCoursesAndLessons.forEach((task: Task) => task.removeCreatorId());
			await this.taskRepo.save(tasksByCreatorIdWithCoursesAndLessons);
		}

		const result = DomainOperationBuilder.build(
			DomainName.TASK,
			OperationType.UPDATE,
			counterOfTasksWithCoursesorLessons,
			this.getTasksId(tasksByCreatorIdWithCoursesAndLessons)
		);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Task',
				DomainName.TASK,
				creatorId,
				StatusModel.FINISHED,
				counterOfTasksWithCoursesorLessons,
				0
			)
		);
		return result;
	}

	async removeUserFromFinished(userId: EntityId): Promise<DomainOperation> {
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Deleting user data from Task archive collection',
				DomainName.TASK,
				userId,
				StatusModel.PENDING
			)
		);
		const [tasksWithUserInFinished, counterOfTasksWithUserInFinished] = await this.taskRepo.findByUserIdInFinished(
			userId
		);

		if (counterOfTasksWithUserInFinished > 0) {
			tasksWithUserInFinished.forEach((task: Task) => task.removeUserFromFinished(userId));

			await this.taskRepo.save(tasksWithUserInFinished);
		}

		const result = DomainOperationBuilder.build(
			DomainName.TASK,
			OperationType.UPDATE,
			counterOfTasksWithUserInFinished,
			this.getTasksId(tasksWithUserInFinished)
		);
		this.logger.info(
			new DataDeletionDomainOperationLoggable(
				'Successfully deleted user data from Task archive collection',
				DomainName.TASK,
				userId,
				StatusModel.FINISHED,
				counterOfTasksWithUserInFinished,
				0
			)
		);

		return result;
	}

	private getTasksId(tasks: Task[]): EntityId[] {
		return tasks.map((task) => task.id);
	}
}

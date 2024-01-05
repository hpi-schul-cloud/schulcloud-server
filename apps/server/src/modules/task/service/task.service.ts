import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { Task } from '@shared/domain/entity';
import { DomainOperation, IFindOptions } from '@shared/domain/interface';
import { Counted, DomainModel, EntityId } from '@shared/domain/types';
import { TaskRepo } from '@shared/repo';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { LegacyLogger } from '@src/core/logger';
import { SubmissionService } from './submission.service';

@Injectable()
export class TaskService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionService: SubmissionService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: LegacyLogger
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

	async deleteTasksByOnlyCreator(creatorId: EntityId): Promise<DomainOperation> {
		this.logger.log(`Deleting Tasks where creatorId ${creatorId} is only parent`);
		const [tasksByOnlyCreatorId, counterOfTasksOnlyWithCreatorId] = await this.taskRepo.findByOnlyCreatorId(creatorId);

		if (counterOfTasksOnlyWithCreatorId > 0) {
			const promiseDeletedTasks = tasksByOnlyCreatorId.map((task: Task) => this.delete(task));
			await Promise.all(promiseDeletedTasks);
		}

		const result = DomainOperationBuilder.build(DomainModel.TASK, 0, counterOfTasksOnlyWithCreatorId);
		this.logger.log(
			`Successfully deleted ${counterOfTasksOnlyWithCreatorId} where creatorId ${creatorId} is only parent`
		);

		return result;
	}

	async removeCreatorIdFromTasks(creatorId: EntityId): Promise<DomainOperation> {
		this.logger.log(`Deleting creatorId ${creatorId} from Tasks`);
		const [tasksByCreatorIdWithCoursesAndLessons, counterOfTasksWithCoursesorLessons] =
			await this.taskRepo.findByCreatorIdWithCourseAndLesson(creatorId);

		if (counterOfTasksWithCoursesorLessons > 0) {
			tasksByCreatorIdWithCoursesAndLessons.forEach((task: Task) => task.removeCreatorId());
			await this.taskRepo.save(tasksByCreatorIdWithCoursesAndLessons);
		}

		const result = DomainOperationBuilder.build(DomainModel.TASK, counterOfTasksWithCoursesorLessons, 0);
		this.logger.log(`Successfully updated ${counterOfTasksWithCoursesorLessons} Tasks without creatorId ${creatorId}`);
		return result;
	}

	async removeUserFromFinished(userId: EntityId): Promise<DomainOperation> {
		this.logger.log(`Deleting userId ${userId} from Archve collection in Tasks`);
		const [tasksWithUserInFinished, counterOfTasksWithUserInFinished] = await this.taskRepo.findByUserIdInFinished(
			userId
		);

		if (counterOfTasksWithUserInFinished > 0) {
			tasksWithUserInFinished.forEach((task: Task) => task.removeUserFromFinished(userId));

			await this.taskRepo.save(tasksWithUserInFinished);
		}

		const result = DomainOperationBuilder.build(DomainModel.TASK, counterOfTasksWithUserInFinished, 0);
		this.logger.log(
			`Successfully updated ${counterOfTasksWithUserInFinished} Tasks without userId ${userId} in archive collection in Tasks`
		);

		return result;
	}
}

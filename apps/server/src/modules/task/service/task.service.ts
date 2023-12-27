import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { Task } from '@shared/domain/entity';
import { DomainOperation, IFindOptions } from '@shared/domain/interface';
import { Counted, DomainModel, EntityId } from '@shared/domain/types';
import { TaskRepo } from '@shared/repo';
import { SubmissionService } from './submission.service';
import { DomainOperationBuilder } from '../builder/domain-operation.builder';

@Injectable()
export class TaskService {
	constructor(
		private readonly taskRepo: TaskRepo,
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

	async removeCreatorId(creatorId: EntityId): Promise<DomainOperation> {
		const [tasksByOnlyCreatorId] = await this.taskRepo.findByOnlyCreatorId(creatorId);

		const promiseDeletedTasks = tasksByOnlyCreatorId.map((task: Task) => this.delete(task));

		await Promise.all(promiseDeletedTasks);

		const [tasksByCreatorIdWithCoursesAndLessons] = await this.taskRepo.findByCreatorIdWithCourseAndLesson(creatorId);

		tasksByCreatorIdWithCoursesAndLessons.forEach((task: Task) => task.removeCreatorId());
		await this.taskRepo.save(tasksByCreatorIdWithCoursesAndLessons);

		// TODO add array with reference od object dleteed and updated

		return DomainOperationBuilder.build(
			DomainModel.TASK,
			promiseDeletedTasks.length,
			tasksByCreatorIdWithCoursesAndLessons.length
		);
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
}

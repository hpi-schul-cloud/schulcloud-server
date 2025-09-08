import { Logger } from '@core/logger';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Injectable } from '@nestjs/common';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { Task, TaskRepo } from '../../repo';
import { SubmissionService } from './submission.service';

@Injectable()
export class TaskService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly submissionService: SubmissionService,
		private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService,
		private readonly logger: Logger
	) {
		this.logger.setContext(TaskService.name);
	}

	public async findBySingleParent(
		creatorId: EntityId,
		courseId: EntityId,
		filters?: { draft?: boolean; noFutureAvailableDate?: boolean },
		options?: IFindOptions<Task>
	): Promise<Counted<Task[]>> {
		const tasks = await this.taskRepo.findBySingleParent(creatorId, courseId, filters, options);

		return tasks;
	}

	public async delete(task: Task): Promise<void> {
		await this.filesStorageClientAdapterService.deleteFilesOfParent(task.id);

		await this.deleteSubmissions(task);

		await this.taskRepo.delete(task);
	}

	private async deleteSubmissions(task: Task): Promise<void> {
		const submissions = task.submissions.getItems();
		const promises = submissions.map((submission) => this.submissionService.delete(submission));

		await Promise.all(promises);
	}

	public async findById(taskId: EntityId): Promise<Task> {
		const task = await this.taskRepo.findById(taskId);
		return task;
	}
}

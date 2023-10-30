import { Injectable } from '@nestjs/common';
import { Task } from '@shared/domain/entity/task.entity';
import { IFindOptions } from '@shared/domain/interface/find-options';
import { Counted } from '@shared/domain/types/counted';
import { EntityId } from '@shared/domain/types/entity-id';
import { TaskRepo } from '@shared/repo/task/task.repo';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client/service/files-storage-client.service';
import { SubmissionService } from './submission.service';

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

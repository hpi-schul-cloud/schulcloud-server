import { Injectable } from '@nestjs/common';
import { Counted, EntityId, IFindOptions, Task } from '@shared/domain';
import { TaskRepo } from '@shared/repo';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
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
}

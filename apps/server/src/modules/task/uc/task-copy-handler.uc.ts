import { Inject, Injectable } from '@nestjs/common';
import { EntityId, Task, User } from '@shared/domain';
import { OperationStatus } from '@shared/domain/entity/operation-status.entity';

export interface ICopyTaskService {
	copyTaskAsync(params: TaskCopyParams): Promise<OperationStatus>;
}

export interface ICopyTaskHandler {
	handleCopyTask(params: TaskCopyParams): Promise<Task>;
}

export type TaskCopyParams = {
	originalTask: Task;
	copyParentCourseId: EntityId;
	copyParentLessonId?: EntityId;
	user: User;
	parentOperationId?: EntityId;
};

export interface ICopyTaskQueueService {
	copyTask(task: Task, operation: OperationStatus): Promise<void>;
}

export const ICopyTaskQueueServiceToken = Symbol('ICopyTaskQueueService');

export interface ICopyFileService {
	copyFileAsync: Promise<OperationStatus>;
}

export interface IOperationLogService {
	LogOperationStart(title: string, original?: EntityId): Promise<OperationStatus>;
}

export const IOperationLogServiceSymbol = Symbol('IOperationLogService');

@Injectable()
export class TaskCopyService implements ICopyTaskHandler, ICopyTaskService {
	constructor(
		@Inject(ICopyTaskQueueServiceToken) private readonly queueService: ICopyTaskQueueService,
		@Inject(IOperationLogServiceSymbol) private readonly operationLog: IOperationLogService
	) {}

	async copyTaskAsync() {
		const status = await this.operationLog.LogOperationStart('copy task');
		return status;
	}

	async handleCopyTask(params: TaskCopyParams): Promise<Task> {
		return Promise.resolve(new Task({ name: 'naem', school: params.originalTask.school, creator: params.user }));
	}
}

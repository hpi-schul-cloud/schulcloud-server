import { Injectable } from '@nestjs/common';
import { EntityId, Task, User, Course } from '@shared/domain';
import { OperationStatus } from '@shared/domain/entity/operation-status.entity';

export interface ICopyTaskService {
	copyTaskAsync(params: TaskCopyParams): Promise<OperationStatus>;
}

export interface ICopyTaskHandler {
	handleCopyTask(params: TaskCopyParams): Promise<Task>;
}

export type TaskCopyParams = {
	originalTask: Task;
	destinationCourse: Course;
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
export class TaskCopyService {
	copyTaskMetadata(params: TaskCopyParams): Task {
		return new Task({
			name: params.originalTask.name,
			description: params.originalTask.description,
			school: params.user.school,
			creator: params.user,
			course: params.destinationCourse,
		});
	}
}

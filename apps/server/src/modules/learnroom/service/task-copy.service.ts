import { Injectable } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { Course, Lesson, Task, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@shared/domain/types';
import { TaskRepo } from '@shared/repo';
import { CopyFilesService } from '@src/modules/files-storage-client';
import { FileUrlReplacement } from '@src/modules/files-storage-client/service/copy-files.service';

type TaskCopyParams = {
	originalTask: Task;
	destinationCourse?: Course;
	destinationLesson?: Lesson;
	user: User;
	copyName?: string;
};

@Injectable()
export class TaskCopyService {
	constructor(
		private readonly taskRepo: TaskRepo,
		private readonly copyHelperService: CopyHelperService,
		private readonly copyFilesService: CopyFilesService
	) {}

	async copyTask(params: TaskCopyParams): Promise<CopyStatus> {
		const { originalTask, user, destinationCourse, destinationLesson } = params;

		const taskCopy = await this.copyTaskEntity(params, originalTask, user, destinationCourse, destinationLesson);

		const { fileUrlReplacements, fileCopyStatus } = await this.copyFilesService.copyFilesOfEntity(
			originalTask,
			taskCopy,
			user.id
		);

		await this.updateFileUrls(taskCopy, fileUrlReplacements);

		return this.deriveCopyStatus(fileCopyStatus, taskCopy, params);
	}

	private async copyTaskEntity(
		params: TaskCopyParams,
		originalTask: Task,
		user: User,
		destinationCourse: Course | undefined,
		destinationLesson: Lesson | undefined
	) {
		const taskCopy = new Task({
			name: params.copyName || originalTask.name,
			description: originalTask.description,
			descriptionInputFormat: params.originalTask.descriptionInputFormat,
			school: user.school,
			creator: user,
			course: destinationCourse,
			lesson: destinationLesson,
		});
		await this.taskRepo.createTask(taskCopy);
		return taskCopy;
	}

	private async updateFileUrls(task: Task, fileUrlReplacements: FileUrlReplacement[]) {
		fileUrlReplacements.forEach(({ regex, replacement }) => {
			task.description = task.description.replace(regex, replacement);
		});
		await this.taskRepo.save(task);
	}

	private deriveCopyStatus(fileCopyStatus: CopyStatus, taskCopy: Task, params: TaskCopyParams) {
		const elements = [
			{
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.CONTENT,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.SUBMISSION_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
			fileCopyStatus,
		];

		const status: CopyStatus = {
			title: taskCopy.name,
			type: CopyElementType.TASK,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: taskCopy,
			originalEntity: params.originalTask,
			elements,
		};
		return status;
	}
}

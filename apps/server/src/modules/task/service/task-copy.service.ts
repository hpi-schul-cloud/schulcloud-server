import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Course, Lesson, Task, User } from '@shared/domain/entity';
import { TaskRepo } from '@shared/repo';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { CopyFilesService } from '@src/modules/files-storage-client';
import { FileUrlReplacement } from '@src/modules/files-storage-client/service/copy-files.service';

type TaskCopyParams = {
	originalTaskId: EntityId;
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
		const { user, destinationLesson, destinationCourse } = params;
		const originalTask = await this.taskRepo.findById(params.originalTaskId);

		const taskCopy = await this.copyTaskEntity(params, originalTask, user, destinationCourse, destinationLesson);

		const { fileUrlReplacements, fileCopyStatus } = await this.copyFilesService.copyFilesOfEntity(
			originalTask,
			taskCopy,
			user.id
		);

		await this.updateFileUrls(taskCopy, fileUrlReplacements);

		return this.deriveCopyStatus(fileCopyStatus, originalTask, taskCopy);
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
			descriptionInputFormat: originalTask.descriptionInputFormat,
			school: user.school,
			creator: user,
			course: destinationCourse,
			lesson: destinationLesson,
			teamSubmissions: originalTask.teamSubmissions,
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

	private deriveCopyStatus(fileCopyStatus: CopyStatus, originalTask: Task, taskCopy: Task) {
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
			originalEntity: originalTask,
			elements,
		};
		return status;
	}
}

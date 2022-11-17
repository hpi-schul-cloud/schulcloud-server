import { Injectable } from '@nestjs/common';
import { CopyHelperService } from '@shared/domain';
import { Course, Lesson, Task, User } from '@shared/domain/entity';
import { CopyElementType, CopyStatus, CopyStatusEnum, EntityId } from '@shared/domain/types';
import { TaskRepo } from '@shared/repo';
import { CopyFilesService } from '@src/modules/files-storage-client';
import { FileUrlReplacement } from '@src/modules/files-storage-client/service/copy-files.service';
import { FileLegacyService } from '@shared/domain/service/file-legacy.service';

import { uniq } from 'lodash';
import { CopyLegacyFilesService } from '@src/modules/files-storage-client/service/copy-legacy-files.service';

export type TaskCopyParams = {
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
		private readonly copyFilesService: CopyFilesService,
		private readonly copyLegacyFilesService: CopyLegacyFilesService
	) {}

	async copyTask(params: TaskCopyParams): Promise<CopyStatus> {
		const { originalTask, user, destinationCourse, destinationLesson } = params;

		const taskCopy = new Task({
			name: params.copyName || originalTask.name,
			description: originalTask.description,
			descriptionInputFormat: params.originalTask.descriptionInputFormat,
			school: user.school,
			creator: user,
			course: destinationCourse,
			lesson: destinationLesson,
		});

		await this.taskRepo.save(taskCopy);

		const copyFilesResult = await this.copyFilesService.copyFilesOfEntity(originalTask, taskCopy, user.id);

		const legacyFileIds = this.extractLegacyFileIds(taskCopy.description);
		const targetCourseId = (destinationCourse ? destinationCourse.id : destinationLesson?.course.id) as string;

		const copyLegacyFilesResult = await this.copyLegacyFilesService.copyLegacyFiles(
			legacyFileIds,
			targetCourseId,
			user.id
		);

		taskCopy.description = this.replaceFileUrls(taskCopy.description, copyFilesResult.fileUrlReplacements);
		taskCopy.description = this.replaceFileUrls(taskCopy.description, copyLegacyFilesResult.fileUrlReplacements);

		await this.taskRepo.save(taskCopy);

		const fileCopyStatus = this.mergeFileCopyStates(copyFilesResult.copyStatus, copyLegacyFilesResult.copyStatus);
		const elements = [...this.defaultTaskStatusElements(), fileCopyStatus];

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

	private replaceFileUrls(text: string, fileUrlReplacements: FileUrlReplacement[]) {
		fileUrlReplacements.forEach(({ regex, replacement }) => {
			text = text.replace(regex, replacement);
		});
		return text;
	}

	private extractLegacyFileIds(text: string): string[] {
		const regEx = new RegExp(`(?<=src="(https?://[^"]*)?/files/file\\?file=).+?(?=&amp;)`, 'g');
		const fileIds = text.match(regEx);
		return fileIds ? uniq(fileIds) : [];
	}

	private mergeFileCopyStates(fileGroupStatus: CopyStatus, legacyFileGroupStatus: CopyStatus): CopyStatus {
		const elements = [...(fileGroupStatus.elements || []), ...(legacyFileGroupStatus.elements || [])];
		return {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			elements,
		};
	}

	private defaultTaskStatusElements(): CopyStatus[] {
		return [
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
		];
	}
}

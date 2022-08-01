import { Injectable } from '@nestjs/common';
import { FileDto, FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { uniq } from 'lodash';
import { IComponentProperties, Lesson, Task } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum, EntityId } from '../types';
import { CopyHelperService } from './copy-helper.service';
import { FileLegacyService } from './file-legacy.service';

export const fileUrlRegex = '"(https?://[^"]*)?/files/file\\?file=';

@Injectable()
export class FileCopyAppendService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly fileCopyAdapterService: FilesStorageClientAdapterService,
		private readonly fileLegacyService: FileLegacyService
	) {}

	async appendFiles(copyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.TASK) {
			return this.appendFilesToTask(copyStatus, jwt);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(copyStatus.elements.map((el) => this.appendFiles(el, jwt)));
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		return Promise.resolve(copyStatus);
	}

	private async appendFilesToTask(taskCopyStatus: CopyStatus, jwt: string): Promise<CopyStatus> {
		const taskCopyStatusCopy = { ...taskCopyStatus };
		if (taskCopyStatusCopy.copyEntity === undefined || taskCopyStatusCopy.originalEntity === undefined) {
			return taskCopyStatusCopy;
		}
		try {
			const original: Task = taskCopyStatusCopy.originalEntity as Task;
			const copy: Task = taskCopyStatusCopy.copyEntity as Task;
			const source = FileParamBuilder.buildForTask(jwt, original.school.id, original.id);
			const target = FileParamBuilder.buildForTask(jwt, copy.school.id, copy.id);
			const files = await this.fileCopyAdapterService.copyFilesOfParent(source, target);
			return this.createSuccessCopyStatus(taskCopyStatusCopy, files);
		} catch (err) {
			return this.createFailedCopyStatus(taskCopyStatusCopy);
		}
	}

	private createSuccessCopyStatus(taskCopyStatus: CopyStatus, files: FileDto[]): CopyStatus {
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: CopyStatusEnum.SUCCESS,
			elements: this.createFileStatuses(files),
		};
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements as CopyStatus[]);
		taskCopyStatus.elements = this.replaceFileGroup(taskCopyStatus.elements, fileGroupStatus);
		return taskCopyStatus;
	}

	private createFailedCopyStatus(taskCopyStatus: CopyStatus) {
		let fileGroupStatus = this.getFileGroupStatus(taskCopyStatus?.elements);
		if (fileGroupStatus === undefined) {
			fileGroupStatus = {
				type: CopyElementType.FILE_GROUP,
				status: CopyStatusEnum.FAIL,
			};
		}
		const elements =
			fileGroupStatus?.elements && fileGroupStatus.elements.length > 0
				? fileGroupStatus?.elements?.map((el) => {
						el.status = CopyStatusEnum.FAIL;
						return el;
				  })
				: undefined;
		const updatedFileGroupStatus = {
			...fileGroupStatus,
			status: CopyStatusEnum.FAIL,
			elements,
		};
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements as CopyStatus[]);
		taskCopyStatus.elements = this.replaceFileGroup(taskCopyStatus.elements, updatedFileGroupStatus);
		return taskCopyStatus;
	}

	private getFileGroupStatus(elements: CopyStatus[] = []): CopyStatus {
		return elements?.find((el) => el.type === CopyElementType.FILE_GROUP) as CopyStatus;
	}

	private replaceFileGroup(elements: CopyStatus[] = [], fileGroupStatus: CopyStatus): CopyStatus[] {
		return elements.map((el) => (el.type === CopyElementType.FILE_GROUP ? fileGroupStatus : el));
	}

	private createFileStatuses(files: FileDto[]): CopyStatus[] {
		return files.map((file) => ({
			type: CopyElementType.FILE,
			name: file.name,
			status: CopyStatusEnum.SUCCESS,
		}));
	}

	async copyFiles(copyStatus: CopyStatus, courseId: EntityId, userId: EntityId, jwt: string): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.LESSON) {
			return this.copyEmbeddedFilesOfLessons(copyStatus, courseId, userId);
		}
		if (copyStatus.type === CopyElementType.TASK) {
			const updatedStatus = await this.appendFilesToTask(copyStatus, jwt);
			return this.copyEmbeddedFilesOfTasks(updatedStatus, courseId, userId);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(
				copyStatus.elements.map((el) => this.copyFiles(el, courseId, userId, jwt))
			);
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		return Promise.resolve(copyStatus);
	}

	async copyEmbeddedFilesOfLessons(
		lessonCopyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId
	): Promise<CopyStatus> {
		if (lessonCopyStatus.type !== CopyElementType.LESSON) {
			return lessonCopyStatus;
		}
		const lesson = lessonCopyStatus.copyEntity as Lesson;
		const legacyFileIds: string[] = [];

		lesson.contents.forEach((item: IComponentProperties) => {
			if (item.content === undefined || !('text' in item.content)) {
				return;
			}

			const contentFileIds = this.extractOldFileIds(item.content.text);

			legacyFileIds.push(...contentFileIds);
		});

		if (legacyFileIds.length > 0) {
			const legacyFileResponses = await Promise.all(
				legacyFileIds.map((fileId) => this.fileLegacyService.copyFile({ fileId, targetCourseId: courseId, userId }))
			);

			legacyFileResponses.forEach(({ oldFileId, fileId, filename }) => {
				lesson.contents = lesson.contents.map((item: IComponentProperties) => {
					if ('text' in item.content && fileId && filename) {
						const text = this.replaceOldFileUrls(item.content.text, oldFileId, fileId, filename);
						return { ...item, content: { ...item.content, text } };
					}

					return item;
				});
			});
		}

		lessonCopyStatus.copyEntity = lesson;

		return lessonCopyStatus;
	}

	async copyEmbeddedFilesOfTasks(
		taskCopyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId
	): Promise<CopyStatus> {
		if (taskCopyStatus.type !== CopyElementType.TASK) {
			return taskCopyStatus;
		}

		const task = taskCopyStatus.copyEntity as Task;

		const legacyFileIds = this.extractOldFileIds(task.description);

		if (legacyFileIds.length > 0) {
			const legacyFileResponses = await Promise.all(
				legacyFileIds.map((fileId) => this.fileLegacyService.copyFile({ fileId, targetCourseId: courseId, userId }))
			);

			legacyFileResponses.forEach(({ oldFileId, fileId, filename }) => {
				if (fileId && filename) {
					task.description = this.replaceOldFileUrls(task.description, oldFileId, fileId, filename);
				}
			});

			taskCopyStatus.copyEntity = task;
		}

		return taskCopyStatus;
	}

	extractOldFileIds(text: string): string[] {
		const regEx = new RegExp(`(?<=src=${fileUrlRegex}).+?(?=&amp;)`, 'g');
		const fileIds = text.match(regEx);
		return fileIds ? uniq(fileIds) : [];
	}

	replaceOldFileUrls(text: string, oldFileId: EntityId, fileId: EntityId, filename: string): string {
		const regEx = new RegExp(`${fileUrlRegex}${oldFileId}.+?"`, 'g');
		const newUrl = `"/files/file?file=${fileId}&amp;name=${filename}"`;

		return text.replace(regEx, newUrl);
	}
}

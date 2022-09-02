import { Injectable } from '@nestjs/common';
import {
	FileParamBuilder,
	FilesStorageClientAdapterService,
	CopyFilesService,
} from '@src/modules/files-storage-client';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { uniq } from 'lodash';
import { IComponentProperties, Lesson, Task } from '../entity';
import { CopyElementType, CopyStatus, CopyStatusEnum, EntityId } from '../types';
import { CopyHelperService } from './copy-helper.service';
import { FileLegacyResponse, FileLegacyService } from './file-legacy.service';

export const fileUrlRegex = '"(https?://[^"]*)?/files/file\\?file=';

@Injectable()
export class FileCopyAppendService {
	constructor(
		private readonly copyHelperService: CopyHelperService,
		private readonly fileCopyAdapterService: FilesStorageClientAdapterService,
		private readonly fileLegacyService: FileLegacyService,
		private readonly copyFilesService: CopyFilesService
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
			const source = FileParamBuilder.build(jwt, original.school.id, original);
			const target = FileParamBuilder.build(jwt, copy.school.id, copy);
			const files = await this.fileCopyAdapterService.copyFilesOfParent(source, target);
			return this.createSuccessCopyStatus(taskCopyStatusCopy, files);
		} catch (err) {
			return this.createFailedCopyStatus(taskCopyStatusCopy);
		}
	}

	private createSuccessCopyStatus(taskCopyStatus: CopyStatus, files: CopyFileDto[]): CopyStatus {
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: CopyStatusEnum.SUCCESS,
			elements: this.createFileStatuses(files),
		};
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(fileGroupStatus.elements);
		taskCopyStatus.elements = this.setFileGroupStatus(taskCopyStatus.elements, fileGroupStatus);
		return taskCopyStatus;
	}

	private createFailedCopyStatus(taskCopyStatus: CopyStatus) {
		let fileGroupStatus = this.getFileGroupStatus(taskCopyStatus.elements);

		if (fileGroupStatus === undefined) {
			fileGroupStatus = {
				type: CopyElementType.FILE_GROUP,
				status: CopyStatusEnum.FAIL,
			};
		}

		const elements =
			fileGroupStatus.elements && fileGroupStatus.elements.length > 0
				? fileGroupStatus.elements.map((el) => {
						el.status = CopyStatusEnum.FAIL;
						return el;
				  })
				: undefined;
		const updatedFileGroupStatus = {
			...fileGroupStatus,
			status: CopyStatusEnum.FAIL,
			elements,
		};
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements || []);
		taskCopyStatus.elements = this.setFileGroupStatus(taskCopyStatus.elements, updatedFileGroupStatus);
		return taskCopyStatus;
	}

	private getFileGroupStatus(elements: CopyStatus[] = []): CopyStatus {
		return elements.find((el) => el.type === CopyElementType.FILE_GROUP) as CopyStatus;
	}

	private setFileGroupStatus(elements: CopyStatus[] = [], updatedFileGroupStatus: CopyStatus): CopyStatus[] {
		const fileGroupStatus = this.getFileGroupStatus(elements);
		if (fileGroupStatus) {
			return elements.map((el) => (el.type === CopyElementType.FILE_GROUP ? updatedFileGroupStatus : el));
		}
		return [...elements, updatedFileGroupStatus];
	}

	private createFileStatuses(files: CopyFileDto[]): CopyStatus[] {
		return files.map((file) => ({
			type: CopyElementType.FILE,
			title: file.name,
			status: CopyStatusEnum.SUCCESS,
		}));
	}

	private createLegayFileStatusesByCopyResult(files: FileLegacyResponse[]): CopyStatus[] {
		return files.map(({ oldFileId, fileId, filename }) => ({
			type: CopyElementType.FILE,
			status: fileId ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
			title: filename ?? `(old fileid: ${oldFileId})`,
		}));
	}

	private createFileStatusesByCopyResult(files: CopyFileDto[]): CopyStatus[] {
		return files.map(({ sourceId, id, name }) => ({
			type: CopyElementType.FILE,
			status: id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
			title: name ?? `(old fileid: ${sourceId})`,
		}));
	}

	async copyFiles(copyStatus: CopyStatus, courseId: EntityId, userId: EntityId, jwt: string): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.LESSON) {
			return this.copyEmbeddedFilesOfLessons(copyStatus, courseId, userId, jwt);
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
		return copyStatus;
	}

	async copyEmbeddedFilesOfLessons(
		lessonCopyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId,
		jwt: string
	): Promise<CopyStatus> {
		if (!(lessonCopyStatus.copyEntity instanceof Lesson) || !(lessonCopyStatus.originalEntity instanceof Lesson)) {
			return lessonCopyStatus;
		}

		const lesson = lessonCopyStatus.copyEntity;
		const legacyFileIds: string[] = [];

		lesson.contents.forEach((item: IComponentProperties) => {
			if (item.content === undefined || !('text' in item.content)) {
				return;
			}

			const contentFileIds = this.extractOldFileIds(item.content.text);

			legacyFileIds.push(...contentFileIds);
		});

		if (legacyFileIds.length > 0) {
			const fileCopyResults: FileLegacyResponse[] = await Promise.all(
				legacyFileIds.map((fileId) => this.fileLegacyService.copyFile({ fileId, targetCourseId: courseId, userId }))
			);

			fileCopyResults.forEach(({ oldFileId, fileId, filename }) => {
				lesson.contents = lesson.contents.map((item: IComponentProperties) => {
					if ('text' in item.content && fileId && filename) {
						const text = this.replaceOldFileUrls(item.content.text, oldFileId, fileId, filename);
						const itemWithUpdatedText = { ...item, content: { ...item.content, text } };
						return itemWithUpdatedText;
					}

					return item;
				});
			});

			if (fileCopyResults.length > 0) {
				const fileGroupStatus = this.deriveLegacyFileGroupStatus(fileCopyResults);
				lessonCopyStatus.elements = this.setFileGroupStatus(lessonCopyStatus.elements, fileGroupStatus);
				lessonCopyStatus.status = this.copyHelperService.deriveStatusFromElements(lessonCopyStatus.elements);
			}
		}

		const { entity, response } = await this.copyFilesService.copyFilesOfEntity(
			lessonCopyStatus.originalEntity,
			lesson,
			jwt
		);

		lessonCopyStatus.copyEntity = entity;

		if (response.length > 0) {
			const fileGroupStatus = this.deriveFileGroupStatus(response);
			lessonCopyStatus.elements = this.setFileGroupStatus(lessonCopyStatus.elements, fileGroupStatus);
			lessonCopyStatus.status = this.copyHelperService.deriveStatusFromElements(lessonCopyStatus.elements);
		}

		return lessonCopyStatus;
	}

	async copyEmbeddedFilesOfTasks(
		taskCopyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId
	): Promise<CopyStatus> {
		const task = taskCopyStatus.copyEntity as Task;
		const legacyFileIds = this.extractOldFileIds(task.description);

		if (legacyFileIds.length > 0) {
			const fileCopyResults = await Promise.all(
				legacyFileIds.map((fileId) => this.fileLegacyService.copyFile({ fileId, targetCourseId: courseId, userId }))
			);

			fileCopyResults.forEach(({ oldFileId, fileId, filename }) => {
				if (fileId && filename) {
					task.description = this.replaceOldFileUrls(task.description, oldFileId, fileId, filename);
				}
			});

			if (fileCopyResults.length > 0) {
				const fileGroupStatus = this.deriveLegacyFileGroupStatus(fileCopyResults);
				taskCopyStatus.elements = this.setFileGroupStatus(taskCopyStatus.elements, fileGroupStatus);
				taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements);
			}
			taskCopyStatus.copyEntity = task;
		}

		return taskCopyStatus;
	}

	private deriveLegacyFileGroupStatus(fileCopyResults: FileLegacyResponse[]) {
		const fileStatuses = this.createLegayFileStatusesByCopyResult(fileCopyResults);
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(fileStatuses),
			elements: fileStatuses,
		};
		return fileGroupStatus;
	}

	private deriveFileGroupStatus(fileCopyResults: CopyFileDto[]) {
		const fileStatuses = this.createFileStatusesByCopyResult(fileCopyResults);
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(fileStatuses),
			elements: fileStatuses,
		};
		return fileGroupStatus;
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

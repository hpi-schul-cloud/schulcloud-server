import { Injectable } from '@nestjs/common';
import { FileParamBuilder, FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { CopyFileResponse } from '@src/modules/files-storage-client/filesStorageApi/v3';
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

	private createSuccessCopyStatus(taskCopyStatus: CopyStatus, files: CopyFileResponse[]): CopyStatus {
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
		taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements as CopyStatus[]);
		taskCopyStatus.elements = this.setFileGroupStatus(taskCopyStatus.elements, updatedFileGroupStatus);
		return taskCopyStatus;
	}

	private getFileGroupStatus(elements: CopyStatus[] = []): CopyStatus | undefined {
		return elements.find((el) => el.type === CopyElementType.FILE_GROUP) as CopyStatus;
	}

	private setFileGroupStatus(elements: CopyStatus[] = [], updatedFileGroupStatus: CopyStatus): CopyStatus[] {
		const fileGroupStatus = this.getFileGroupStatus(elements);
		if (fileGroupStatus) {
			return elements.map((el) => (el.type === CopyElementType.FILE_GROUP ? updatedFileGroupStatus : el));
		}
		return [...elements, updatedFileGroupStatus];
	}

	private createFileStatuses(files: CopyFileResponse[]): CopyStatus[] {
		return files.map((file) => ({
			type: CopyElementType.FILE,
			title: file.name,
			status: CopyStatusEnum.SUCCESS,
		}));
	}

	private createFileStatusesLessonByCopyResult(files: CopyFileResponse[]): CopyStatus[] {
		return files.map(({ sourceId, id, name }) => ({
			type: CopyElementType.FILE,
			status: id ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
			title: name ?? `(old fileid: ${sourceId})`,
		}));
	}

	private createFileStatusesTaskByCopyResult(files: FileLegacyResponse[]): CopyStatus[] {
		return files.map(({ oldFileId, fileId, filename }) => ({
			type: CopyElementType.FILE,
			status: fileId ? CopyStatusEnum.SUCCESS : CopyStatusEnum.FAIL,
			title: filename ?? `(old fileid: ${oldFileId})`,
		}));
	}

	async copyFiles(
		copyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId,
		schoolId: EntityId,
		jwt: string
	): Promise<CopyStatus> {
		if (copyStatus.type === CopyElementType.LESSON) {
			return this.copyEmbeddedFilesOfLessons(copyStatus, schoolId, jwt);
		}
		if (copyStatus.type === CopyElementType.TASK) {
			const updatedStatus = await this.appendFilesToTask(copyStatus, jwt);
			return this.copyEmbeddedFilesOfTasks(updatedStatus, courseId, userId);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(
				copyStatus.elements.map((el) => this.copyFiles(el, courseId, userId, schoolId, jwt))
			);
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		return copyStatus;
	}

	async copyEmbeddedFilesOfLessons(lessonCopyStatus: CopyStatus, schoolId: EntityId, jwt: string): Promise<CopyStatus> {
		const lessonEntities = this.getLessonEntities(lessonCopyStatus);

		if (!lessonEntities) {
			return lessonCopyStatus;
		}

		const { originalLesson, copyLesson } = lessonEntities;
		const sourceParams = FileParamBuilder.buildForLesson(jwt, schoolId, originalLesson.id);
		const targetParams = FileParamBuilder.buildForLesson(jwt, schoolId, copyLesson.id);
		const response = await this.fileCopyAdapterService.copyFilesOfParent(sourceParams, targetParams);

		if (response.length > 0) {
			copyLesson.contents = this.replaceLessonContentsUrls(copyLesson, response);
			lessonCopyStatus.copyEntity = copyLesson;

			const fileGroupStatus = this.deriveFileGroupLessonStatus(response);
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
				const fileGroupStatus = this.deriveFileGroupTaskStatus(fileCopyResults);
				taskCopyStatus.elements = this.setFileGroupStatus(taskCopyStatus.elements, fileGroupStatus);
				taskCopyStatus.status = this.copyHelperService.deriveStatusFromElements(taskCopyStatus.elements);
			}
			taskCopyStatus.copyEntity = task;
		}

		return taskCopyStatus;
	}

	private deriveFileGroupLessonStatus(fileCopyResults: CopyFileResponse[]) {
		const fileStatuses = this.createFileStatusesLessonByCopyResult(fileCopyResults);
		const fileGroupStatus = {
			type: CopyElementType.FILE_GROUP,
			status: this.copyHelperService.deriveStatusFromElements(fileStatuses),
			elements: fileStatuses,
		};
		return fileGroupStatus;
	}

	private deriveFileGroupTaskStatus(fileCopyResults: FileLegacyResponse[]) {
		const fileStatuses = this.createFileStatusesTaskByCopyResult(fileCopyResults);
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

	private replaceLessonContentsUrls(lesson: Lesson, response: CopyFileResponse[]): [] | IComponentProperties[] {
		return lesson.contents.map((item: IComponentProperties) => {
			response.forEach(({ id, sourceId, name }) => {
				item = this.replaceIdAndName(item, sourceId, id, name);
			});

			return item;
		});
	}

	private replaceIdAndName(
		content: IComponentProperties,
		oldFileId: EntityId,
		fileId: EntityId,
		fileName: string
	): IComponentProperties {
		if (!('text' in content.content)) {
			return content;
		}

		const regEx = new RegExp(`${oldFileId}/${fileName}`, 'g');

		const text = content.content.text.replace(regEx, `${fileId}/${fileName}`);

		return { ...content, content: { ...content.content, text } };
	}

	private getLessonEntities(lessonCopyStatus: CopyStatus): { originalLesson: Lesson; copyLesson: Lesson } | undefined {
		if (lessonCopyStatus.originalEntity instanceof Lesson && lessonCopyStatus.copyEntity instanceof Lesson) {
			return { originalLesson: lessonCopyStatus.originalEntity, copyLesson: lessonCopyStatus.copyEntity };
		}

		return undefined;
	}
}

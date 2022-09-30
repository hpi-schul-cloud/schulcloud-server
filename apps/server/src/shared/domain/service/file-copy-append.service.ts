import { Injectable } from '@nestjs/common';
import { CopyFilesService } from '@src/modules/files-storage-client';
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
		private readonly fileLegacyService: FileLegacyService,
		private readonly copyFilesService: CopyFilesService
	) {}

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
		const { copyEntity, originalEntity, type } = copyStatus;

		if (type === CopyElementType.LESSON && copyEntity instanceof Lesson && originalEntity instanceof Lesson) {
			const status = await this.copyEmbeddedLegacyFilesOfLessons(copyStatus, courseId, userId);

			return this.copyFilesOfEntity(status, originalEntity, copyEntity, jwt);
		}
		if (type === CopyElementType.TASK && copyEntity instanceof Task && originalEntity instanceof Task) {
			const status = await this.copyEmbeddedLegacyFilesOfTasks(copyStatus, courseId, userId);

			return this.copyFilesOfEntity(status, originalEntity, copyEntity, jwt);
		}
		if (copyStatus.elements && copyStatus.elements.length > 0) {
			copyStatus.elements = await Promise.all(
				copyStatus.elements.map((el) => this.copyFiles(el, courseId, userId, jwt))
			);
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}
		return copyStatus;
	}

	async copyEmbeddedLegacyFilesOfLessons(
		lessonCopyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId
	): Promise<CopyStatus> {
		if (!(lessonCopyStatus.copyEntity instanceof Lesson) || !(lessonCopyStatus.originalEntity instanceof Lesson)) {
			return lessonCopyStatus;
		}

		const lesson = lessonCopyStatus.copyEntity;
		const { elements } = lessonCopyStatus;
		const legacyFileIds: string[] = [];

		lesson.contents.forEach((item: IComponentProperties) => {
			if (item.content === undefined || !('text' in item.content)) {
				return;
			}

			const contentFileIds = this.extractOldFileIds(item.content.text);

			legacyFileIds.push(...contentFileIds);
		});

		elements?.map(async (item: CopyStatus) => {
			if (item.type !== CopyElementType.TASK_GROUP) {
				return;
			}

			lessonCopyStatus = await this.copyEmbeddedLegacyFilesOfTasks(lessonCopyStatus, courseId, userId);
		});

		if (legacyFileIds.length > 0) {
			const fileCopyResults: FileLegacyResponse[] = await Promise.all(
				legacyFileIds.map((fileId) => this.fileLegacyService.copyFile({ fileId, targetCourseId: courseId, userId }))
			);

			fileCopyResults.forEach(({ oldFileId, fileId, filename }) => {
				lesson.contents = lesson.contents.map((item: IComponentProperties) => {
					if (
						item.component === 'text' &&
						item.content &&
						'text' in item.content &&
						item.content.text &&
						fileId &&
						filename
					) {
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

		return lessonCopyStatus;
	}

	async copyEmbeddedLegacyFilesOfTasks(
		taskCopyStatus: CopyStatus,
		courseId: EntityId,
		userId: EntityId
	): Promise<CopyStatus> {
		if (!(taskCopyStatus.copyEntity instanceof Task) || !(taskCopyStatus.originalEntity instanceof Task)) {
			return taskCopyStatus;
		}

		const task = taskCopyStatus.copyEntity;
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

	async copyFilesOfEntity(copyStatus: CopyStatus, originalEntity: Task | Lesson, entity: Task | Lesson, jwt: string) {
		const { entity: updatedEntity, response } = await this.copyFilesService.copyFilesOfEntity(
			originalEntity,
			entity,
			jwt
		);

		copyStatus.copyEntity = updatedEntity;

		if (response.length > 0) {
			const fileGroupStatus = this.deriveFileGroupStatus(response);
			copyStatus.elements = this.setFileGroupStatus(copyStatus.elements, fileGroupStatus);
			copyStatus.status = this.copyHelperService.deriveStatusFromElements(copyStatus.elements);
		}

		return copyStatus;
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

import { Injectable } from '@nestjs/common';
import { Task, Lesson, EntityId, IComponentProperties } from '@shared/domain';
import { CopyFileResponse } from '../filesStorageApi/v3';
import { FileRequestInfo } from '../interfaces';
import { FileParamBuilder } from '../mapper/files-storage-param.builder';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

type EntityWithEmbeddedFiles = Task | Lesson;

@Injectable()
export class CopyFilesService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	/**
	 * Copies embedded and appended files of entity
	 */
	async copyFilesOfEntity(
		originalEntity: EntityWithEmbeddedFiles,
		copyEntity: EntityWithEmbeddedFiles,
		schoolId: EntityId,
		jwt: string
	): Promise<{ entity: EntityWithEmbeddedFiles; response: CopyFileResponse[] }> {
		const { sourceParams, targetParams } = this.buildParams(originalEntity, copyEntity, schoolId, jwt);
		const response = await this.filesStorageClientAdapterService.copyFilesOfParent(sourceParams, targetParams);

		const entity = this.replaceUrlsOfEntity(response, copyEntity);

		return { entity, response };
	}

	private replaceUrlsOfEntity(responses: CopyFileResponse[], entity: EntityWithEmbeddedFiles): EntityWithEmbeddedFiles {
		if (responses.length === 0) {
			return entity;
		}

		responses.forEach((response) => {
			if (entity instanceof Lesson) {
				entity = this.replaceUrlsInLessons(entity, response);
			} else if (entity instanceof Task) {
				entity = this.replaceUrlsInTask(entity, response);
			}
		});

		return entity;
	}

	private replaceUrlsInLessons(lesson: Lesson, response: CopyFileResponse): Lesson {
		const { sourceId, id, name } = response;

		lesson.contents = lesson.contents.map((item: IComponentProperties) => {
			if ('text' in item.content && id && name) {
				const text = this.replaceIdAndName(item.content.text, sourceId, id, name);
				const itemWithUpdatedText = { ...item, content: { ...item.content, text } };
				return itemWithUpdatedText;
			}

			return item;
		});

		return lesson;
	}

	private replaceUrlsInTask(task: Task, response: CopyFileResponse): Task {
		const { sourceId, id, name } = response;

		task.description = this.replaceIdAndName(task.description, sourceId, id, name);

		return task;
	}

	private replaceIdAndName(text: string, oldFileId: EntityId, fileId: EntityId, fileName: string): string {
		const regEx = new RegExp(`${oldFileId}/${fileName}`, 'g');

		return text.replace(regEx, `${fileId}/${fileName}`);
	}

	private buildParams(
		originalEntity: EntityWithEmbeddedFiles,
		copyEntity: EntityWithEmbeddedFiles,
		schoolId: EntityId,
		jwt: string
	): { sourceParams: FileRequestInfo; targetParams: FileRequestInfo } {
		if (originalEntity instanceof Lesson) {
			const sourceParams = FileParamBuilder.buildForLesson(jwt, schoolId, originalEntity.id);
			const targetParams = FileParamBuilder.buildForLesson(jwt, schoolId, copyEntity.id);

			return { sourceParams, targetParams };
		}

		const sourceParams = FileParamBuilder.buildForTask(jwt, schoolId, originalEntity.id);
		const targetParams = FileParamBuilder.buildForTask(jwt, schoolId, copyEntity.id);

		return { sourceParams, targetParams };
	}
}

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
		const sourceParams = FileParamBuilder.build(jwt, schoolId, originalEntity);
		const targetParams = FileParamBuilder.build(jwt, schoolId, copyEntity);

		try {
			const response = await this.filesStorageClientAdapterService.copyFilesOfParent(sourceParams, targetParams);

			const entity = this.replaceUrlsOfEntity(response, copyEntity);

			return { entity, response };
		} catch (error) {
			return { entity: copyEntity, response: [] };
		}
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
		lesson.contents = lesson.contents.map((item: IComponentProperties) => {
			if ('text' in item.content) {
				const text = this.replaceUrl(item.content.text, response);
				const itemWithUpdatedText = { ...item, content: { ...item.content, text } };
				return itemWithUpdatedText;
			}

			return item;
		});

		return lesson;
	}

	private replaceUrlsInTask(task: Task, response: CopyFileResponse): Task {
		task.description = this.replaceUrl(task.description, response);

		return task;
	}

	private replaceUrl(text: string, response: CopyFileResponse) {
		const regex = new RegExp(`${response.sourceId}.+?"`, 'g');
		const newUrl = `${response.id}/${response.name}"`;
		return text.replace(regex, newUrl);
	}
}

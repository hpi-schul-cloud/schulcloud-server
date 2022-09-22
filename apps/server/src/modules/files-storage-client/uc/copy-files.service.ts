import { Injectable } from '@nestjs/common';
import { IComponentProperties, Lesson, Task } from '@shared/domain';
import { CopyFileDto } from '../dto';
import { FileParamBuilder } from '../mapper/files-storage-param.builder';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

type EntityWithEmbeddedFiles = Task | Lesson;

@Injectable()
export class CopyFilesService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	async copyFilesOfEntity(
		originalEntity: EntityWithEmbeddedFiles,
		copyEntity: EntityWithEmbeddedFiles,
		jwt: string
	): Promise<{ entity: EntityWithEmbeddedFiles; response: CopyFileDto[] }> {
		const sourceParams = FileParamBuilder.build(jwt, originalEntity.getSchoolId(), originalEntity);
		const targetParams = FileParamBuilder.build(jwt, copyEntity.getSchoolId(), copyEntity);

		const response = await this.filesStorageClientAdapterService.copyFilesOfParent(sourceParams, targetParams);

		const entity = this.replaceUrlsOfEntity(response, copyEntity);

		return { entity, response };
	}

	private replaceUrlsOfEntity(responses: CopyFileDto[], entity: EntityWithEmbeddedFiles): EntityWithEmbeddedFiles {
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

	private replaceUrlsInLessons(lesson: Lesson, response: CopyFileDto): Lesson {
		lesson.contents = lesson.contents.map((item: IComponentProperties) => {
			if (item.content && 'text' in item.content) {
				const text = this.replaceUrl(item.content.text, response);
				const itemWithUpdatedText = { ...item, content: { ...item.content, text } };
				return itemWithUpdatedText;
			}

			return item;
		});

		return lesson;
	}

	private replaceUrlsInTask(task: Task, response: CopyFileDto): Task {
		task.description = this.replaceUrl(task.description, response);

		return task;
	}

	private replaceUrl(text: string, response: CopyFileDto) {
		const regex = new RegExp(`${response.sourceId}.+?"`, 'g');
		const newUrl = `${response.id}/${response.name}"`;
		return text.replace(regex, newUrl);
	}
}

import { Injectable } from '@nestjs/common';
import { EntityId, IComponentProperties, Lesson, Task } from '@shared/domain';
import { CopyFileDto } from '../dto';
import { EntityWithEmbeddedFiles } from '../interfaces';
import { FileParamBuilder } from '../mapper';
import { CopyFilesOfParentParamBuilder } from '../mapper/copy-files-of-parent-param.builder';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

@Injectable()
export class CopyFilesService {
	constructor(private readonly filesStorageClientAdapterService: FilesStorageClientAdapterService) {}

	async copyFilesOfEntity(
		originalEntity: EntityWithEmbeddedFiles,
		copyEntity: EntityWithEmbeddedFiles,
		userId: EntityId
	): Promise<{ entity: EntityWithEmbeddedFiles; response: CopyFileDto[] }> {
		const source = FileParamBuilder.build(originalEntity.getSchoolId(), originalEntity);
		const target = FileParamBuilder.build(copyEntity.getSchoolId(), copyEntity);

		const copyFilesOfParentParams = CopyFilesOfParentParamBuilder.build(userId, source, target);

		const response = await this.filesStorageClientAdapterService.copyFilesOfParent(copyFilesOfParentParams);

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
			if (item.component === 'text' && item.content && 'text' in item.content && item.content.text) {
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

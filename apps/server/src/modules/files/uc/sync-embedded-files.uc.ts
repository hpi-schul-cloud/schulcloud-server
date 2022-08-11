/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecordParentType, IComponentProperties, Lesson, Task } from '@shared/domain';
import { Logger } from '@src/core/logger/logger.service';
import _ from 'lodash';
import { EmbeddedFilesRepo, fileUrlRegex } from '../repo/embedded-files.repo';
import { SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class SyncEmbeddedFilesUc {
	constructor(
		private embeddedFilesRepo: EmbeddedFilesRepo,
		private logger: Logger,
		private syncFilesMetaDataService: SyncFilesMetadataService,
		private syncFilesStorageService: SyncFilesStorageService
	) {}

	async syncEmbeddedFilesForTasks() {
		await this.embeddedFilesRepo.createTaskBackUpCollection();

		const tasks = await this.embeddedFilesRepo.findEmbeddedFilesForTasks();
		this.logger.log(`Found ${tasks.length} tasks descriptions with embedded files.`);

		const promises = tasks.map(async (task) => {
			const fileIds = this.extractFileIds(task);

			const files = await this.embeddedFilesRepo.findFiles(fileIds, task._id, FileRecordParentType.Task);
			return this.syncFiles(files);
		});

		await Promise.all(promises);
	}

	async syncEmbeddedFilesForLesson() {
		await this.embeddedFilesRepo.createLessonBackUpCollection();

		const lessons = await this.embeddedFilesRepo.findEmbeddedFilesForLessons();
		this.logger.log(`Found ${lessons.length} lesson contents with embedded files.`);

		const promises = lessons.map(async (lesson) => {
			const fileIds = this.extractFileIds(lesson);

			const files = await this.embeddedFilesRepo.findFiles(fileIds, lesson._id, FileRecordParentType.Lesson);
			return this.syncFiles(files);
		});

		await Promise.all(promises);
	}

	private extractFileIds(entity: Lesson | Task): ObjectId[] {
		const fileIds: string[] = [];

		if (entity instanceof Lesson) {
			entity.contents.forEach((item: IComponentProperties) => {
				if (item.content === undefined || !('text' in item.content)) {
					return;
				}

				const contentFileIds = this.extractFileIdsFromContent(item.content.text);

				if (contentFileIds !== null) {
					fileIds.push(...contentFileIds);
				}
			});
		}
		if (entity instanceof Task) {
			const contentFileIds = this.extractFileIdsFromContent(entity.description);

			if (contentFileIds !== null) {
				fileIds.push(...contentFileIds);
			}
		}

		return _.uniq(fileIds).map((id) => new ObjectId(id));
	}

	private extractFileIdsFromContent(text: string) {
		const regEx = new RegExp(`(?<=src=${fileUrlRegex}).+?(?=&amp;)`, 'g');
		const contentFileIds = text.match(regEx);

		return contentFileIds;
	}

	private async syncFiles(files: SyncFileItem[]) {
		// eslint-disable-next-line no-await-in-loop
		const promises = files.map((file) => {
			return this.sync(file);
		});
		await Promise.all(promises);
	}

	private async sync(file: SyncFileItem) {
		try {
			await this.syncFilesMetaDataService.prepareMetaData(file);
			await this.syncFilesStorageService.syncS3File(file);
			await this.syncFilesMetaDataService.persistMetaData(file);

			if (file.parentType === FileRecordParentType.Lesson) {
				await this.updateLessonsLinks(file);
			}

			if (file.parentType === FileRecordParentType.Task) {
				await this.updateTaskLinks(file);
			}
			this.logger.log(`Synced file ${file.source.id}`);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;
			this.logger.error(file, stack);
			await this.syncFilesMetaDataService.persistError(file, stack);
		}
	}

	private async updateTaskLinks(file: SyncFileItem) {
		const task = await this.embeddedFilesRepo.findTask(new ObjectId(file.parentId));

		if (task) {
			task.description = this.replaceLink(task.description, file);
			await this.embeddedFilesRepo.updateTask(task);
		}
	}

	private async updateLessonsLinks(file: SyncFileItem) {
		const lesson = await this.embeddedFilesRepo.findLesson(new ObjectId(file.parentId));

		if (lesson) {
			lesson.contents = lesson.contents.map((item: IComponentProperties) => {
				if ('text' in item.content) {
					item.content.text = this.replaceLink(item.content.text, file);
				}

				return item;
			});
			await this.embeddedFilesRepo.updateLesson(lesson);
		}
	}

	private replaceLink(text: string, file: SyncFileItem) {
		const regex = new RegExp(`${fileUrlRegex}${file.source.id}.+?"`, 'g');
		const newUrl = `"/api/v3/file/download/${file.fileRecord.id}/${file.fileRecord.name}"`;
		return text.replace(regex, newUrl);
	}
}

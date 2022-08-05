/* istanbul ignore file */

import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { FileRecordParentType, IComponentProperties, Lesson } from '@shared/domain';
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

	private extractFileIds(lesson: Lesson): ObjectId[] {
		const lessonFileIds: string[] = [];

		lesson.contents.forEach((item: IComponentProperties) => {
			if (item.content === undefined || !('text' in item.content)) {
				return;
			}

			const regEx = new RegExp(`(?<=src=${fileUrlRegex}).+?(?=&amp;)`, 'g');
			const contentFileIds = item.content.text.match(regEx);

			if (contentFileIds !== null) {
				lessonFileIds.push(...contentFileIds);
			}
		});

		return _.uniq(lessonFileIds).map((id) => new ObjectId(id));
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
			await this.updateLessonsLinks(file);
			this.logger.log(`Synced file ${file.source.id}`);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;
			this.logger.error(file, stack);
			await this.syncFilesMetaDataService.persistError(file, stack);
		}
	}

	private async updateLessonsLinks(file: SyncFileItem) {
		const lesson = await this.embeddedFilesRepo.findLesson(new ObjectId(file.parentId));

		if (lesson) {
			lesson.contents = lesson.contents.map((item: IComponentProperties) => {
				const regex = new RegExp(`${fileUrlRegex}${file.source.id}.+?"`, 'g');
				const newUrl = `"/api/v3/file/download/${file.fileRecord.id}/${file.fileRecord.name}"`;

				if ('text' in item.content) {
					item.content.text = item.content.text.replace(regex, newUrl);
				}

				return item;
			});
			await this.embeddedFilesRepo.updateLesson(lesson);
		}
	}
}

/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { ObjectId } from '@mikro-orm/mongodb';
import { IComponentProperties, Lesson } from '@shared/domain';
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
		const lessons = await this.embeddedFilesRepo.findEmbeddedFilesForLessons();
		this.logger.log(`Found ${lessons.length} lesson contents with embedded files.`);

		const promises = lessons.map(async (lesson) => {
			const fileIds = this.extractFileIds(lesson);

			const files = await this.embeddedFilesRepo.findFiles(fileIds, lesson._id);
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
		let promises;

		try {
			// eslint-disable-next-line no-await-in-loop
			promises = files.map(async (file) => {
				await this.syncFilesMetaDataService.prepareMetaData(file);
				await this.syncFilesStorageService.syncS3File(file);
				await this.syncFilesMetaDataService.persistMetaData(file);
				await this.updateLessonsLinks(file);
				this.logger.log(`Synced file ${file.source.id}`);
			});
			await Promise.all(promises);
		} catch (err) {
			this.logger.error(err);
		}
	}

	private async updateLessonsLinks(file: SyncFileItem) {
		const lesson = await this.embeddedFilesRepo.findLesson(new ObjectId(file.parentId));

		if (lesson) {
			lesson.contents = lesson.contents.map((item: IComponentProperties) => {
				const regex = new RegExp(`${fileUrlRegex}${file.source.id}.+?"`, 'g');
				const newUrl = `/api/v3/file/download/${file.fileRecord.id}/${file.fileRecord.name}`;

				if ('text' in item.content) {
					item.content.text = item.content.text.replace(regex, newUrl);
				}

				return item;
			});
			await this.embeddedFilesRepo.updateLesson(lesson);
		}
	}
}

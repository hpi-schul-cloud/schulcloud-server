/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { ObjectId } from '@mikro-orm/mongodb';
import { IComponentProperties } from '@shared/domain';
import { EmbeddedFilesRepo } from '../repo/embedded-files.repo';
import { ExtendedLesson } from '../types/extended-lesson';
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

	extractFileIds(content: ExtendedLesson): ObjectId[] {
		const contentText = content.lesson.contents[0].content.text;
		const regEx = /(?<=src="(https?:\/\/[^"]*)?\/files\/file\?file=).+?(?=&amp;)/g;
		const fileIds = contentText.match(regEx);

		if (fileIds === null) {
			return [];
		}

		return fileIds.map((id) => new ObjectId(id));
	}

	async updateLessonsLinks(file: SyncFileItem) {
		const lesson = await this.embeddedFilesRepo.findLesson(new ObjectId(file.parentId));

		if (lesson) {
			lesson.contents = lesson.contents.map((item: IComponentProperties) => {
				const regex = new RegExp(`"(https?://[^"]*)?/files/file\\?file=${file.source.id}.+?"`, 'g');
				const newUrl = `/api/v3/file/download/${file.fileRecord.id}/${file.fileRecord.name}`;

				item.content.text = item.content.text.replace(regex, newUrl);

				return item;
			});
			await this.embeddedFilesRepo.updateLesson(lesson);
		}
	}

	async syncFiles(files: SyncFileItem[]) {
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

	async syncEmbeddedFilesForLesson() {
		const contents = await this.embeddedFilesRepo.findEmbeddedFilesForLessons();
		this.logger.log(`Found ${contents.length} lesson contents with embedded files.`);

		const promises = contents.map(async (content) => {
			const fileIds = this.extractFileIds(content);

			const files = await this.embeddedFilesRepo.findFiles(fileIds, content.lesson._id);
			return this.syncFiles(files);
		});

		await Promise.all(promises);
	}
}

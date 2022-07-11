/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { EmbeddedFilesRepo } from '../repo/embedded-files.repo';
import { ExtendedLesson } from '../types/extended-lesson';

@Injectable()
export class SyncEmbeddedFilesUc {
	constructor(private embeddedFilesRepo: EmbeddedFilesRepo, private logger: Logger) {}

	extractFileIds(content: ExtendedLesson): string[] {
		const contentText = content.lesson.contents[0].content.text;
		const regEx = /(?<=src="(https?:\/\/[^"]*)?\/files\/file\?file=).+?(?=&amp;)/g;
		const fileIds = contentText.match(regEx);

		if (fileIds === null) {
			return [];
		}

		return fileIds;
	}

	async syncEmbeddedFilesForLesson() {
		const contents = await this.embeddedFilesRepo.findEmbeddedFilesForLessons();
		this.logger.log(`Found ${contents.length} lesson contents with embedded files.`);

		contents.map((content) => {
			const fileIds = this.extractFileIds(content);

			console.log(fileIds);
		});
	}
}

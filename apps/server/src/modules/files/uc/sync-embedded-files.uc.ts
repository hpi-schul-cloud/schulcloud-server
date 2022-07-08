/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { EmbeddedFilesRepo } from '../repo/embedded-files.repo';

@Injectable()
export class SyncEmbeddedFilesUc {
	constructor(private embeddedFilesRepo: EmbeddedFilesRepo, private logger: Logger) {}

	async syncEmbeddedFilesForLesson() {
		const result = await this.embeddedFilesRepo.findEmbeddedFilesForLessons();
		this.logger.log(`Found ${result.length} lesson contents with embedded files.`);
	}
}

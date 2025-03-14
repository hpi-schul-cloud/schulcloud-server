import { Inject, Injectable } from '@nestjs/common';
import { S3ClientAdapter } from '@infra/s3-client';
import { LegacyLogger } from '@core/logger';
import { FWU_CONTENT_S3_CONNECTION } from '../fwu-learning-contents.config';

@Injectable()
export class FwuLearningContentsUc {
	constructor(
		private logger: LegacyLogger,
		@Inject(FWU_CONTENT_S3_CONNECTION) private readonly storageClient: S3ClientAdapter
	) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	async get(path: string, bytesRange?: string) {
		const response = await this.storageClient.get(path, bytesRange);
		return response;
	}
}

import { Injectable } from '@nestjs/common';
import { S3ClientAdapter } from '@shared/infra/s3-file-storage';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class FwuLearningContentsUc {
	constructor(private logger: LegacyLogger, private readonly storageClient: S3ClientAdapter) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	async get(path: string, bytesRange?: string) {
		const response = await this.storageClient.get(path, bytesRange);
		return response;
	}
}

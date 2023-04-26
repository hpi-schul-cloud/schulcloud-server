import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../../files-storage/client/s3-client.adapter';

@Injectable()
export class FwuLearningContentsUc {
	constructor(private logger: Logger, private readonly storageClient: S3ClientAdapter) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	async get(path: string, bytesRange?: string) {
		const response = await this.storageClient.get(path, bytesRange);
		return response;
	}
}

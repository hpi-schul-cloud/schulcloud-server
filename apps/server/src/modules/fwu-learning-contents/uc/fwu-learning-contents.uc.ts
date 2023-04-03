import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@src/core/logger';
import { S3ClientAdapter } from '../../files-storage/client/s3-client.adapter';
import { S3Config } from '../interface/config';

@Injectable()
export class FwuLearningContentsUc {
	constructor(
		private logger: Logger,
		@Inject('S3_Config') readonly config: S3Config,
		@Inject('S3_Client') readonly client: S3Client,
		private readonly storageClient: S3ClientAdapter
	) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	async get(path: string, bytesRange?: string) {
		try {
			const response = await this.storageClient.get(path, bytesRange);
			return response;
		} catch (error: unknown) {
			if (error && typeof error === 'object' && 'name' in error && 'stack' in error) {
				throw new InternalServerErrorException({
					name: error.name,
					message: 'unexpected error on reading file from FWU S3 storage',
					cause: error.stack,
				});
			}
		}
	}
}

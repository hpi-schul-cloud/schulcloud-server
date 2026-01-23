import { LegacyLogger } from '@core/logger';
import { GetFile, S3ClientAdapter } from '@infra/s3-client';
import { Inject, Injectable } from '@nestjs/common';
import { FWU_S3_CLIENT_INJECTION_TOKEN } from '../fwu.const';

@Injectable()
export class FwuLearningContentsUc {
	constructor(
		private logger: LegacyLogger,
		@Inject(FWU_S3_CLIENT_INJECTION_TOKEN) private readonly storageClient: S3ClientAdapter
	) {
		this.logger.setContext(FwuLearningContentsUc.name);
	}

	public async get(path: string, bytesRange?: string): Promise<GetFile> {
		const response = await this.storageClient.get(path, bytesRange);

		return response;
	}
}

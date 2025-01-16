import { LegacyLogger } from '@src/core/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaMetadataSyncService {
	constructor(private readonly logger: LegacyLogger) {}

	public async syncMediaMetadata(): Promise<void> {
		this.logger.warn('Media metadata sync is to be implemented');
		await Promise.resolve();
	}
}

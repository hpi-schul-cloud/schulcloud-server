import { Injectable } from '@nestjs/common';
import { MediaSourceSyncReport } from '../domain';

@Injectable()
export class MediaSourceSyncService {
	public async syncAllMediaMetadata(): Promise<MediaSourceSyncReport> {
		// TODO register & call strategy (now only bilo)

		const dummyReport: MediaSourceSyncReport = {
			totalCount: 0,
			successCount: 0,
			failedCount: 0,
			undeliveredCount: 0,
			operations: [],
		};

		await Promise.resolve();

		return dummyReport;
	}
}

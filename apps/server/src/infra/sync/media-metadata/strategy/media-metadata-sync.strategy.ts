import { Injectable } from '@nestjs/common';
import { SyncStrategy } from '../../strategy/sync-strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { MediaMetadataSyncService } from '../service';

@Injectable()
export class MediaMetadataSyncStrategy implements SyncStrategy {
	constructor(private readonly mediaMetadataSyncService: MediaMetadataSyncService) {}

	public getType(): SyncStrategyTarget {
		return SyncStrategyTarget.MEDIA_METADATA;
	}

	public async sync(): Promise<void> {
		await this.mediaMetadataSyncService.syncMediaMetadata();
	}
}

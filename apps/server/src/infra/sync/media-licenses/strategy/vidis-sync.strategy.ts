import { VidisClientAdapter } from '@infra/vidis-client';
import {
	MediaSource,
	MediaSourceDataFormat,
	MediaSourceService,
	MediaSourceNotFoundLoggableException,
} from '@modules/media-source';
import { Injectable } from '@nestjs/common';
import { SyncStrategy } from '../../strategy/sync-strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { VidisSyncService } from '../service';

@Injectable()
export class VidisSyncStrategy extends SyncStrategy {
	constructor(
		private readonly vidisSyncService: VidisSyncService,
		private readonly vidisClientAdapter: VidisClientAdapter,
		private readonly mediaSourceService: MediaSourceService
	) {
		super();
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.VIDIS;
	}

	public async sync(): Promise<void> {
		const mediaSource: MediaSource | null = await this.mediaSourceService.findByFormat(MediaSourceDataFormat.VIDIS);

		if (!mediaSource) {
			throw new MediaSourceNotFoundLoggableException(MediaSourceDataFormat.VIDIS);
		}

		const vidisOfferItems = await this.vidisClientAdapter.getOfferItemsByRegion(mediaSource);

		await this.vidisSyncService.syncMediaSchoolLicenses(mediaSource, vidisOfferItems);
	}
}

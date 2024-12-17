import { Injectable } from '@nestjs/common';
import { SyncStrategy } from '../../strategy/sync-strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { VidisSyncService } from '../service/vidis-sync.service';

@Injectable()
export class VidisSyncStrategy extends SyncStrategy {
	constructor(private readonly vidisSyncService: VidisSyncService) {
		super();
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.VIDIS;
	}

	public async sync(): Promise<void> {
		const mediaSource = await this.vidisSyncService.getVidisMediaSource();
		const vidisItems = await this.vidisSyncService.getSchoolActivationsFromVidis(mediaSource);
		await this.vidisSyncService.syncMediaSchoolLicenses(mediaSource, vidisItems);
	}
}

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SyncStrategy } from '../../strategy/sync-strategy';
import { SyncStrategyTarget } from '../../sync-strategy.types';
import { VidisSyncService } from '../service/vidis-sync.service';

@Injectable()
export class VidisSyncStrategy extends SyncStrategy {
	constructor(private readonly logger: Logger, private readonly vidisSyncService: VidisSyncService) {
		super();
		this.logger.setContext(VidisSyncStrategy.name);
	}

	public override getType(): SyncStrategyTarget {
		return SyncStrategyTarget.VIDIS;
	}

	public async sync(): Promise<void> {
		console.time('Synchronization Time');
		console.log('Synchronize!');
		console.timeEnd('Synchronization Time');

		return Promise.resolve();
	}
}

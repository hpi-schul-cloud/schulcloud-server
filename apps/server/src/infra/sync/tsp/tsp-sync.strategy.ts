import { Injectable } from '@nestjs/common';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	sync(): Promise<void> {
		// implementation
		return Promise.resolve();
	}
}

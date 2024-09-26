import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';

@Injectable()
export class TspSyncStrategy extends SyncStrategy {
	constructor(private readonly logger: Logger) {
		super();
		this.logger.setContext(TspSyncStrategy.name);
	}

	getType(): SyncStrategyTarget {
		return SyncStrategyTarget.TSP;
	}

	sync(): Promise<void> {
		// implementation
		// Just for testing purposes
		this.logger.info({
			getLogMessage() {
				return {
					message: 'Running TSP sync',
				};
			},
		});
		return Promise.resolve();
	}
}

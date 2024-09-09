import { Injectable, Optional } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { TspSyncStrategy } from '../tsp/tsp-sync.strategy';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { InvalidTargetLoggable } from '../errors/invalid-target.loggable';

@Injectable()
export class SyncService {
	private strategies: Map<SyncStrategyTarget, SyncStrategy> = new Map<SyncStrategyTarget, SyncStrategy>();

	constructor(private readonly logger: Logger, @Optional() private readonly tspSyncStrategy?: TspSyncStrategy) {
		this.logger.setContext(SyncService.name);
		this.registerStrategy(tspSyncStrategy);
	}

	protected registerStrategy(strategy?: SyncStrategy) {
		if (strategy) {
			this.strategies.set(strategy.getType(), strategy);
		}
	}

	public async startSync(target: string): Promise<void> {
		const targetStrategy = target as SyncStrategyTarget;
		if (!this.strategies.has(targetStrategy)) {
			this.logger.info(new InvalidTargetLoggable(target));
		}
		await this.strategies.get(targetStrategy)?.sync();
	}
}

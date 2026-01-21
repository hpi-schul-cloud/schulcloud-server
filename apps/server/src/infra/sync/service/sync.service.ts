import { Logger } from '@core/logger';
import { Inject, Injectable } from '@nestjs/common';
import { InvalidTargetLoggable } from '../errors/invalid-target.loggable';
import { SyncStrategy } from '../strategy/sync-strategy';
import { TspSyncStrategy } from '../strategy/tsp/tsp-sync.strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';
import { SYNC_CONFIG_TOKEN, SyncConfig } from '../sync.config';

@Injectable()
export class SyncService {
	private strategies: Map<SyncStrategyTarget, SyncStrategy> = new Map<SyncStrategyTarget, SyncStrategy>();

	constructor(
		private readonly logger: Logger,
		@Inject(SYNC_CONFIG_TOKEN) private readonly config: SyncConfig,
		private readonly tspSyncStrategy: TspSyncStrategy
	) {
		this.logger.setContext(SyncService.name);
		if (this.config.tspSyncEnabled) {
			this.registerStrategy(this.tspSyncStrategy);
		}
	}

	protected registerStrategy(strategy: SyncStrategy): void {
		this.strategies.set(strategy.getType(), strategy);
	}

	public async startSync(target: string): Promise<void> {
		const targetStrategy = target as SyncStrategyTarget;
		if (!this.strategies.has(targetStrategy)) {
			this.logger.info(new InvalidTargetLoggable(target));
		}
		await this.strategies.get(targetStrategy)?.sync();
	}
}

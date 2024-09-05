import { Injectable } from '@nestjs/common';
import { TspSyncStrategy } from '../tsp/tsp-sync.strategy';
import { SyncStrategy } from '../strategy/sync-strategy';
import { SyncStrategyTarget } from '../sync-strategy.types';

@Injectable()
export class SyncService {
	strategies: Map<SyncStrategyTarget, SyncStrategy> = new Map<SyncStrategyTarget, SyncStrategy>();

	constructor(private readonly tspSyncStrategy: TspSyncStrategy) {
		this.registerStrategy(tspSyncStrategy);
	}

	protected registerStrategy(strategy: SyncStrategy) {
		this.strategies.set(strategy.getType(), strategy);
	}

	public async startSync(target: string): Promise<void> {
		const targetStrategy = target as SyncStrategyTarget;
		if (!this.strategies.has(targetStrategy)) {
			throw new Error('please provide a valid target strategy name to start its synchronization process');
		}
		await this.strategies.get(targetStrategy)?.sync();
	}
}

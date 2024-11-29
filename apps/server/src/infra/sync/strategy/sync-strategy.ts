import { SyncStrategyTarget } from '../sync-strategy.types';

export abstract class SyncStrategy {
	abstract getType(): SyncStrategyTarget;

	abstract sync(): Promise<void>;
}

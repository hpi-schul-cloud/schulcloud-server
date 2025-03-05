import { SyncStrategyTarget } from '../sync-strategy.types';

export abstract class SyncStrategy {
	public abstract getType(): SyncStrategyTarget;

	public abstract sync(): Promise<void>;
}

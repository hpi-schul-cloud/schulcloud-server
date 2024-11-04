import { SyncStrategyTarget } from '../sync-strategy.types';

export abstract class SyncStrategy {
	abstract getType(): SyncStrategyTarget;

	abstract sync(): Promise<void>;
}

// TODO: think about folder structure, in other cases the strategy specific folders are in the strategy folder

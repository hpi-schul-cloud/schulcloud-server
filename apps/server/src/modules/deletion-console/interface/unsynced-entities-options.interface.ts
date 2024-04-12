import { EntityId } from '@shared/domain/types';

export interface UnsyncedEntitiesOptions {
	systemId: EntityId;
	unsyncedForMinutes: number;
	targetRefDomain?: string;
	deleteInMinutes?: number;
	callsDelayMs?: number;
}

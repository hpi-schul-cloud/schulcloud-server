import { EntityId } from '@shared/domain/types';
import { UnsyncedEntitiesOptions } from '../interface';

export class UnsyncedEntitiesOptionsBuilder {
	static build(
		systemId: EntityId,
		unsyncedForMinutes: number,
		targetRefDomain?: string,
		deleteInMinutes?: number,
		callsDelayMs?: number
	): UnsyncedEntitiesOptions {
		return {
			systemId,
			unsyncedForMinutes,
			targetRefDomain,
			deleteInMinutes,
			callsDelayMs,
		};
	}
}

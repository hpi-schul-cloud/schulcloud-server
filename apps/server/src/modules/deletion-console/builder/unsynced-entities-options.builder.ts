import { type EntityId } from '@shared/domain/types';
import { type UnsyncedEntitiesOptions } from '../interface';

export class UnsyncedEntitiesOptionsBuilder {
	public static build(
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

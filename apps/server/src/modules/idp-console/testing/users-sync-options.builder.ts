import { type EntityId } from '@shared/domain/types';
import { type SystemType, type UsersSyncOptions } from '../api/interface';

export class UsersSyncOptionsBuilder {
	static build(systemType: SystemType, systemId: EntityId): UsersSyncOptions {
		return {
			systemType,
			systemId,
		};
	}
}

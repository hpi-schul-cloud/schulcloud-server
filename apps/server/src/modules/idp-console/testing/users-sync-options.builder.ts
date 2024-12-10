import { EntityId } from '@shared/domain/types';
import { SystemType, UsersSyncOptions } from '../api/interface';

export class UsersSyncOptionsBuilder {
	static build(systemType: SystemType, systemId: EntityId): UsersSyncOptions {
		return {
			systemType,
			systemId,
		};
	}
}

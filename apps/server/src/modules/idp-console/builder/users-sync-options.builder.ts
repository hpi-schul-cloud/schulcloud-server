import { EntityId } from '@shared/domain/types';
import { SystemType, UsersSyncOptions } from '../interface';

export class UsersSyncOptionsBuilder {
	static build(systemType: SystemType, systemId: EntityId): UsersSyncOptions {
		return {
			systemType,
			systemId,
		};
	}
}

import { EntityId } from '@shared/domain/types';
import { SystemType } from './system-type.enum';

export interface UsersSyncOptions {
	systemType: SystemType;
	systemId: EntityId;
}

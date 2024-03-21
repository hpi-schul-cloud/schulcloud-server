import { EntityId } from '@shared/domain/types';
import { SystemType } from './system-type.enum';

export interface SyncOptions {
	systemType: SystemType;
	systemId: EntityId;
}

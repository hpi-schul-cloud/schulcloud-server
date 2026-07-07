import { type EntityId } from '@shared/domain/types';
import { type SystemType } from './system-type.enum';

export interface UsersSyncOptions {
	systemType: SystemType;
	systemId: EntityId;
}

import { type EntityId } from '@shared/domain/types';
import { type FileRecordParentType, type StorageLocation } from './files-storage';

export interface FileRequestInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentType: FileRecordParentType;
	parentId: EntityId;
}

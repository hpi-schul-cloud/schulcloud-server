import { EntityId } from '@shared/domain/types';
import { FileRecordParentType, StorageLocation } from './files-storage';

export interface FileRequestInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentType: FileRecordParentType;
	parentId: EntityId;
}

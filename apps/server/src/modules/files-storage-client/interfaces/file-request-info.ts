import { EntityId } from '@shared/domain/types';
import { FileRecordParentType } from './files-storage';
import { StorageLocation } from '@infra/files-storage-client';

export interface FileRequestInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentType: FileRecordParentType;
	parentId: EntityId;
}

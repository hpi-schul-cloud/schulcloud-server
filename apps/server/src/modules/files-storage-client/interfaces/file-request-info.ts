import { StorageLocation } from '@infra/files-storage-rest-client';
import { EntityId } from '@shared/domain/types';
import { FileRecordParentType } from './files-storage';

export interface FileRequestInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentType: FileRecordParentType;
	parentId: EntityId;
}

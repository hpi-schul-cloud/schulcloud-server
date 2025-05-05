import { StorageLocation } from '@infra/files-storage-client';
import { FileRecordParentType } from '@infra/rabbitmq';
import { EntityId } from '@shared/domain/types';

export interface FileRequestInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentType: FileRecordParentType;
	parentId: EntityId;
}

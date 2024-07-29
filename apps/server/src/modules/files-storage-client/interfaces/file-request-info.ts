import { FileRecordParentType } from '@infra/rabbitmq';
import { StorageLocation } from '@modules/files-storage/interface';
import { EntityId } from '@shared/domain/types';

export interface FileRequestInfo {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
	parentType: FileRecordParentType;
	parentId: EntityId;
}

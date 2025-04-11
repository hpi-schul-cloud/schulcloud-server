import { FileRecordParentType, StorageLocation } from '../../../domain/interface';

export const availableParentTypes = Object.values(FileRecordParentType).join(', ');
export const availableStorageLocations = Object.values(StorageLocation).join(', ');

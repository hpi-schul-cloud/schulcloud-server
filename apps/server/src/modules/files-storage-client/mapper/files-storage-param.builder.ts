import { StorageLocation } from '@modules/files-storage/entity';
import { EntityId } from '@shared/domain/types';
import { EntitiesWithFiles, FileRequestInfo } from '../interfaces';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

export class FileParamBuilder {
	static build(storageLocationId: EntityId, parent: EntitiesWithFiles): FileRequestInfo {
		const parentType = FilesStorageClientMapper.mapEntityToParentType(parent);
		const fileRequestInfo = {
			parentType,
			storageLocationId,
			storageLocation: StorageLocation.SCHOOL,
			parentId: parent.id,
		};

		return fileRequestInfo;
	}
}

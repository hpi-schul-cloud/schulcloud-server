import { EntityId } from '@shared/domain/types/entity-id';
import { IFileRequestInfo } from '../interfaces/file-request-info';
import { EntitiesWithFiles } from '../interfaces/types';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

export class FileParamBuilder {
	static build(schoolId: EntityId, parent: EntitiesWithFiles): IFileRequestInfo {
		const parentType = FilesStorageClientMapper.mapEntityToParentType(parent);
		const fileRequestInfo = {
			parentType,
			schoolId,
			parentId: parent.id,
		};

		return fileRequestInfo;
	}
}

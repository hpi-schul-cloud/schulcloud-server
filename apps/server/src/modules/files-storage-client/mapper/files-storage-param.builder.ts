import { EntityId } from '@shared/domain';
import { EntitiesWithFiles, FileRequestInfo } from '../interfaces';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

export class FileParamBuilder {
	static build(schoolId: EntityId, parent: EntitiesWithFiles): FileRequestInfo {
		const parentType = FilesStorageClientMapper.mapEntityToParentType(parent);
		const fileRequestInfo = {
			parentType,
			schoolId,
			parentId: parent.id,
		};

		return fileRequestInfo;
	}
}

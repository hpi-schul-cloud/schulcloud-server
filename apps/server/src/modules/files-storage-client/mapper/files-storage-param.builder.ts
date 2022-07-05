import { EntityId } from '@shared/domain';
import { FileRecordParamsParentTypeEnum } from '../filesStorageApi/v3';
import { FileRequestInfo } from '../interfaces';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

export class FileParamBuilder {
	static build(
		jwt: string,
		schoolId: EntityId,
		parentTypeString: FileRecordParamsParentTypeEnum,
		parentId: EntityId
	): FileRequestInfo {
		const parentType = FilesStorageClientMapper.mapStringToParentType(parentTypeString);
		const fileRequestInfo = {
			jwt,
			parentType,
			schoolId,
			parentId,
		};

		return fileRequestInfo;
	}

	static buildForTask(jwt: string, schoolId: EntityId, parentId: EntityId): FileRequestInfo {
		const fileRequestInfo = FileParamBuilder.build(jwt, schoolId, 'tasks', parentId);

		return fileRequestInfo;
	}
}

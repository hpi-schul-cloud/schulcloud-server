import { EntityId } from '@shared/domain';
import { FileRecordParamsParentTypeEnum } from '../fileStorageApi/v3';
import { FileRequestInfo } from '../interfaces';
import { FileStorageClientMapper } from './file-storage-client.mapper';

export class FileRequestInfoBuilder {
	static build(
		jwt: string,
		schoolId: EntityId,
		parentTypeString: FileRecordParamsParentTypeEnum,
		parentId: EntityId
	): FileRequestInfo {
		const parentType = FileStorageClientMapper.mapStringToPartenType(parentTypeString);
		const fileRequestInfo = {
			jwt,
			parentType,
			schoolId,
			parentId,
		};

		return fileRequestInfo;
	}

	static task(jwt: string, schoolId: EntityId, parentId: EntityId): FileRequestInfo {
		const fileRequestInfo = FileRequestInfoBuilder.build(jwt, schoolId, 'tasks', parentId);

		return fileRequestInfo;
	}
}

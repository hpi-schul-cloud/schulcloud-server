import { EntityId, FileRecordParentType } from '@shared/domain';
import { FileRequestInfo } from '../interfaces';

export class FileRequestInfoBuilder {
	static build(jwt: string, schoolId: EntityId, parentType: FileRecordParentType, parentId: EntityId): FileRequestInfo {
		const fileRequestInfo = {
			jwt,
			parentType,
			schoolId,
			parentId,
		};

		return fileRequestInfo;
	}
}

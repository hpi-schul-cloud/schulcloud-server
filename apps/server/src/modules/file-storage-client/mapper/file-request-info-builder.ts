import { EntityId, FileRecordParentType } from '@shared/domain';
import { FileRequestInfo } from '../interfaces';

export class FileRequestInfoBuilder {
	static build(
		userId: EntityId,
		schoolId: EntityId,
		parentType: FileRecordParentType,
		parentId: EntityId
	): FileRequestInfo {
		const fileRequestInfo = {
			jwt: '123',
			parentType,
			schoolId,
			parentId,
		};

		return fileRequestInfo;
	}
}

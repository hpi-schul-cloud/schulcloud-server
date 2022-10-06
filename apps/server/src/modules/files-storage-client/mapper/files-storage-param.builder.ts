import { EntityId, Lesson, Task } from '@shared/domain';
import { FileRequestInfo } from '../interfaces';
import { FilesStorageClientMapper } from './files-storage-client.mapper';

export class FileParamBuilder {
	static build(schoolId: EntityId, parent: Task | Lesson): FileRequestInfo {
		const parentType = FilesStorageClientMapper.mapEntityToParentType(parent);
		const fileRequestInfo = {
			parentType,
			schoolId,
			parentId: parent.id,
		};

		return fileRequestInfo;
	}
}

import { EntityId, Lesson, Task } from '@shared/domain';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { FileParamBuilder } from './files-storage-param.builder';

export class CopyFilesOfParentParamBuilder {
	static build(userId: EntityId, source: Task | Lesson, target: Task | Lesson): CopyFilesRequestInfo {
		const fileRequestInfo = {
			userId,
			source: FileParamBuilder.build(source.getSchoolId(), source),
			target: FileParamBuilder.build(target.getSchoolId(), target),
		};

		return fileRequestInfo;
	}
}

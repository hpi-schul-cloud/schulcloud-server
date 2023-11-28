import { EntityId } from '@shared/domain';
import { FileRequestInfo } from '../interfaces';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';

export class CopyFilesOfParentParamBuilder {
	static build(userId: EntityId, source: FileRequestInfo, target: FileRequestInfo): CopyFilesRequestInfo {
		const fileRequestInfo = {
			userId,
			source,
			target,
		};

		return fileRequestInfo;
	}
}

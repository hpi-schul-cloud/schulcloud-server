import { EntityId } from '@shared/domain/types';
import { FileRequestInfo, CopyFilesRequestInfo } from '../interfaces';

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

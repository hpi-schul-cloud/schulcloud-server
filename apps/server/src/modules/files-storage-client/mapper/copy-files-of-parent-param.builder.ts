import { EntityId } from '@shared/domain';
import { IFileRequestInfo } from '../interfaces';
import { ICopyFilesRequestInfo } from '../interfaces/copy-file-request-info';

export class CopyFilesOfParentParamBuilder {
	static build(userId: EntityId, source: IFileRequestInfo, target: IFileRequestInfo): ICopyFilesRequestInfo {
		const fileRequestInfo = {
			userId,
			source,
			target,
		};

		return fileRequestInfo;
	}
}

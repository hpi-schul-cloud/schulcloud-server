import { EntityId } from '@shared/domain/types/entity-id';
import { ICopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { IFileRequestInfo } from '../interfaces/file-request-info';

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

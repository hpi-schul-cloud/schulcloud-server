import { type CopyFilesRequestInfo, type FileRequestInfo } from '@infra/files-storage-amqp-client';
import { type EntityId } from '@shared/domain/types';

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

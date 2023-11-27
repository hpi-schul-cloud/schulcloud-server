import { EntityId } from '@shared/domain';
import { FileRequestInfo } from './file-request-info';

export interface CopyFilesRequestInfo {
	userId: EntityId;
	source: FileRequestInfo;
	target: FileRequestInfo;
}

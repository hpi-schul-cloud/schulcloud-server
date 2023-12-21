import { EntityId } from '@shared/domain/types';
import { FileRequestInfo } from './file-request-info';

export interface CopyFilesRequestInfo {
	userId: EntityId;
	source: FileRequestInfo;
	target: FileRequestInfo;
}

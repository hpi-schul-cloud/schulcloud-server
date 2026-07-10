import { type EntityId } from '@shared/domain/types';
import { type FileRequestInfo } from './file-request-info';

export interface CopyFilesRequestInfo {
	userId: EntityId;
	source: FileRequestInfo;
	target: FileRequestInfo;
}

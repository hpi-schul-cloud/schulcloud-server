import { EntityId } from '@shared/domain';
import { IFileRequestInfo } from './file-request-info';

export interface ICopyFilesRequestInfo {
	userId: EntityId;
	source: IFileRequestInfo;
	target: IFileRequestInfo;
}

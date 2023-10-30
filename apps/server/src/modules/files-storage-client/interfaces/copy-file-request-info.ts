import { EntityId } from '@shared/domain/types/entity-id';
import { IFileRequestInfo } from './file-request-info';

export interface ICopyFilesRequestInfo {
	userId: EntityId;
	source: IFileRequestInfo;
	target: IFileRequestInfo;
}

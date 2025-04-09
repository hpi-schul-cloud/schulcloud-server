import { EntityId } from '@shared/domain/types';
import { Readable } from 'stream';
import type { PreviewParams } from '../../api/dto';
import type { FileRecordEntity } from '../../repo';
import { StorageLocation } from './storage-location.enum';

export interface GetFileResponse {
	data: Readable;
	etag?: string;
	contentType?: string;
	contentLength?: number;
	contentRange?: string;
	name: string;
}

export interface PreviewFileParams {
	fileRecord: FileRecordEntity;
	previewParams: PreviewParams;
	hash: string;
	originFilePath: string;
	previewFilePath: string;
	format: string;
	bytesRange?: string;
}

export interface StorageLocationParams {
	storageLocationId: EntityId;
	storageLocation: StorageLocation;
}

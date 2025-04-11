import { EntityId } from '@shared/domain/types';
import { Readable } from 'stream';
import type { PreviewParams } from '../controller/dto';
import type { FileRecord } from '../entity';
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
	fileRecord: FileRecord;
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

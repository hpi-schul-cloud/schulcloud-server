import { Readable } from 'stream';
import type { PreviewParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { PreviewWidth } from './preview-width.enum';

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

export interface PreviewOptions {
	format: string;
	width?: PreviewWidth;
}

export interface PreviewFileOptions {
	originFilePath: string;
	previewFilePath: string;
	previewOptions: PreviewOptions;
}

export interface PreviewResponseMessage {
	previewFilePath: string;
	status: boolean;
}

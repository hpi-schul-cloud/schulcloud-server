import { Readable } from 'stream';
import { DownloadFileParams, PreviewParams } from '../controller/dto/file-storage.params';
import { FileRecord } from '../entity/filerecord.entity';

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
	downloadParams: DownloadFileParams;
	previewParams: PreviewParams;
	hash: string;
	filePath: string;
	bytesRange?: string;
}

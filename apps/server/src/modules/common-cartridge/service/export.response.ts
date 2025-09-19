import { Readable } from 'stream';

export interface ExportResponse {
	data: Readable;
	contentType?: string;
	contentLength?: number;
	contentRange?: string;
	name: string;
}

import { Readable } from 'node:stream';

export interface GetFileResponse {
	data: Readable;
	etag?: string;
	contentType?: string;
	contentLength?: number;
	contentRange?: string;
	name: string;
}

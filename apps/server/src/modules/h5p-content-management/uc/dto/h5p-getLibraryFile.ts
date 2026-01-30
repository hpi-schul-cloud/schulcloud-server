import { Readable } from 'stream';

export interface GetLibraryFile {
	data: Readable;
	contentType: string;
	contentLength: number;
	contentRange?: { start: number; end: number };
}

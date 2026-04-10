import { Readable } from 'stream';

export interface CommonCartridgeExportResponse {
	data: Readable;
	name: string;
}

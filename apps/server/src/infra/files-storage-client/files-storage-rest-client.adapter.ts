import { Logger } from '@src/core/logger';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi, private readonly logger: Logger) {
		this.logger.setContext(FilesStorageRestClientAdapter.name);
	}

	public async download(fileRecordId: string, fileName: string) {
		// const response = await this.api.download(fileRecordId, fileName);
		// const file = await response.data.arrayBuffer();
		// const content = Buffer.from(file).toString('utf8');

		return this.api.download(fileRecordId, fileName);
	}

	// private async streamToString(stream: Stream): Promise<string> {
	// 	const chunks: Uint8Array[] = [];

	// 	return new Promise((resolve, reject) => {
	// 		stream.on('data', (chunk: Uint8Array) => {
	// 			chunks.push(chunk);
	// 		});
	// 		stream.on('end', () => {
	// 			resolve(Buffer.concat(chunks).toString('utf8'));
	// 		});
	// 		stream.on('error', reject);
	// 	});
	// }
}

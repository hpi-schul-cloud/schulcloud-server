import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { Stream } from 'stream';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string, logger: Logger): Promise<string> {
		logger.warning({
			getLogMessage() {
				return {
					message: 'Downloading file',
					fileRecordId,
					fileName,
				};
			},
		});

		const response = (await this.api.download(fileRecordId, fileName, undefined, {
			responseType: 'stream',
		})) as AxiosResponse<Stream>;
		const file = await this.streamToString(response.data);

		logger.warning({
			getLogMessage() {
				return {
					message: 'File downloaded',
					response,
				};
			},
		});

		return file;
	}

	private async streamToString(stream: Stream): Promise<string> {
		const chunks: Uint8Array[] = [];

		return new Promise((resolve, reject) => {
			stream.on('data', (chunk: Uint8Array) => {
				chunks.push(chunk);
			});
			stream.on('end', () => {
				resolve(Buffer.concat(chunks).toString('utf8'));
			});
			stream.on('error', reject);
		});
	}
}

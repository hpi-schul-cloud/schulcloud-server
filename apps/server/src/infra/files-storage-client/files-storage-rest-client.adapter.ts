import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string, logger: Logger): Promise<Buffer> {
		const response = (await this.api.download(fileRecordId, fileName, undefined, {
			responseType: 'stream',
		})) as AxiosResponse<Blob>;
		const file = await response.data.arrayBuffer();
		const buffer = Buffer.from(file);

		logger.warning({
			getLogMessage() {
				return {
					message: 'File downloaded',
					response,
				};
			},
		});

		return buffer;
	}
}

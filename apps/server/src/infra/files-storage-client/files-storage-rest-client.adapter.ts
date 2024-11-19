import { Logger } from '@src/core/logger';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi, private readonly logger: Logger) {
		this.logger.setContext(FilesStorageRestClientAdapter.name);
	}

	public async download(fileRecordId: string, fileName: string): Promise<string> {
		const response = await this.api.download(fileRecordId, fileName, undefined, { responseType: 'blob' });
		const data = response.data.toString();

		return data;
	}
}

import { Logger } from '@src/core/logger';
import { AxiosResponse } from 'axios';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi, private readonly logger: Logger) {
		this.logger.setContext(FilesStorageRestClientAdapter.name);
	}

	public async download(fileRecordId: string, fileName: string): Promise<AxiosResponse<File>> {
		return this.api.download(fileRecordId, fileName, undefined, {
			responseType: 'blob',
		});
	}
}

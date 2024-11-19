import { AxiosResponse } from 'axios';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string): Promise<AxiosResponse<object>> {
		return this.api.download(fileRecordId, fileName, undefined, { responseType: 'blob' });
	}
}

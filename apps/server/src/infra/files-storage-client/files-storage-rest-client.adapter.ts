import { AxiosResponse } from 'axios';
import { Stream } from 'stream';
import { FileApi } from './generated';

export class FilesStorageRestClientAdapter {
	constructor(private readonly api: FileApi) {}

	public async download(fileRecordId: string, fileName: string): Promise<AxiosResponse<Stream>> {
		return this.api.download(fileRecordId, fileName, undefined, { responseType: 'stream' }) as Promise<
			AxiosResponse<Stream>
		>;
	}
}
